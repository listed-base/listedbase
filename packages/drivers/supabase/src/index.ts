import {
    SupabaseClient,
    createClient,
    RealtimeChannel,
    PostgrestError,
  } from '@supabase/supabase-js'
  
  // ============================================================
  // SupabaseDriver
  // ============================================================
  
  interface SupabaseConfig {
    url:    string
    key:    string
    client?: SupabaseClient   // أو يمرر client جاهز
    pool?: {
      min: number
      max: number
    }
  }
  
  export class SupabaseDriver implements IRelationalBase {
  
    readonly storageType = 'relational' as const
  
    readonly capabilities: LDriverCapabilities = {
      requiresSchema:     true,
      realtime:           true,
      nativeTransactions: true,
      nativeTimestamps:   true,
  
      supportedRefine: {
        returnEntity: true,   // RETURNING * بعد كل mutation
        returnBefore: true,   // SELECT قبل العملية
        returnDiff:   true,   // SELECT قبل + RETURNING * بعد
      },
  
      environment: 'edge',    // HTTP/WS — يعمل في server / serverless / edge
    }
  
    private client!: SupabaseClient
  
    // ----------------------------------------------------------
    // Lifecycle
    // ----------------------------------------------------------
  
    async connect(config: SupabaseConfig, lists?: LListMeta[]): Promise<void> {
      this.client = config.client ?? createClient(config.url, config.key)
  
      // Supabase schemaless من ناحية الـ driver
      // لكن نستخدم lists لبناء الـ indexes وفهم الـ relations
      // التهيئة الفعلية للـ tables تكون عبر Supabase migrations خارج الـ driver
    }
  
    async disconnect(): Promise<void> {
      await this.client.removeAllChannels()
    }
  
    // ----------------------------------------------------------
    // Read
    // ----------------------------------------------------------
  
    async findOne(
      list:  string,
      where: LUniqueFilter | LWhereFilter,
    ): Promise<Record<string, unknown> | null> {
  
      let q = this.client.from(list).select('*')
      q     = this.applyFilter(q, where)
  
      const { data, error } = await q.limit(1).single()
  
      if (error) {
        if (error.code === 'PGRST116') return null   // not found
        throw this.normalizeError(error)
      }
  
      return data as Record<string, unknown>
    }
  
    async findMany(
      list: string,
      opts: {
        where?:  LWhereFilter
        sort?:   LSortFilter
        cursor?: LCursor
        take?:   number
      } = {},
    ): Promise<{ items: Record<string, unknown>[]; nextCursor: LCursor | null }> {
  
      let q = this.client.from(list).select('*')
  
      if (opts.where)  q = this.applyFilter(q, opts.where)
      if (opts.sort)   q = this.applySort(q, opts.sort)
      if (opts.cursor) q = this.applyCursor(q, opts.cursor, opts.sort)
      if (opts.take)   q = q.limit(opts.take)
  
      const { data, error } = await q
  
      if (error) throw this.normalizeError(error)
  
      const items     = (data ?? []) as Record<string, unknown>[]
      const lastItem  = items[items.length - 1]
      const sortField = opts.sort ? Object.keys(opts.sort)[0] : 'id'
  
      const nextCursor: LCursor | null = lastItem && items.length === (opts.take ?? Infinity)
        ? { field: sortField, value: lastItem[sortField] }
        : null
  
      return { items, nextCursor }
    }
  
    async count(list: string, where?: LWhereFilter): Promise<number> {
      let q = this.client.from(list).select('*', { count: 'exact', head: true })
      if (where) q = this.applyFilter(q, where)
  
      const { count, error } = await q
      if (error) throw this.normalizeError(error)
      return count ?? 0
    }
  
    async exists(list: string, where: LUniqueFilter | LWhereFilter): Promise<boolean> {
      const result = await this.findOne(list, where)
      return result !== null
    }
  
    // ----------------------------------------------------------
    // Mutations
    // ----------------------------------------------------------
  
    async create(
      list:    string,
      data:    Record<string, unknown>,
      refine?: LRefineOptions,
    ): Promise<LMutationResult> {
  
      const { data: created, error } = await this.client
        .from(list)
        .insert(data)
        .select('*')       // RETURNING * دائماً — Supabase يدعمه native
        .single()
  
      if (error) throw this.normalizeError(error)
  
      const entity = created as Record<string, unknown>
  
      return {
        data:   this.extractGeneratedFields(entity),
        entity: refine?.returnEntity ? entity : undefined,
      }
    }
  
    async update(
      list:    string,
      where:   LUniqueFilter,
      data:    Record<string, unknown>,
      refine?: LRefineOptions,
    ): Promise<LMutationResult> {
  
      // returnBefore أو returnDiff — نحتاج قراءة قبل العملية
      let before: Record<string, unknown> | undefined
  
      if (refine?.returnBefore || refine?.returnDiff) {
        before = await this.findOne(list, where) ?? undefined
        if (!before) throw this.buildError('DB/NOT_FOUND', `Item not found in ${list}`)
      }
  
      let q = this.client.from(list).update(data)
      q     = this.applyFilter(q, where)
  
      const { data: updated, error } = await q.select('*').single()
  
      if (error) throw this.normalizeError(error)
  
      const entity = updated as Record<string, unknown>
  
      return {
        data:   this.extractGeneratedFields(entity),
        entity: refine?.returnEntity                    ? entity                          : undefined,
        before: refine?.returnBefore && !refine.returnDiff ? before                      : undefined,
        diff:   refine?.returnDiff && before            ? { before, after: entity }       : undefined,
      }
    }
  
    async delete(
      list:    string,
      where:   LUniqueFilter,
      refine?: Pick<LRefineOptions, 'returnBefore'>,
    ): Promise<LMutationResult> {
  
      // returnBefore — نقرأ قبل الحذف
      let before: Record<string, unknown> | undefined
  
      if (refine?.returnBefore) {
        before = await this.findOne(list, where) ?? undefined
        if (!before) throw this.buildError('DB/NOT_FOUND', `Item not found in ${list}`)
      }
  
      let q = this.client.from(list).delete()
      q     = this.applyFilter(q, where)
  
      const { error } = await q
  
      if (error) throw this.normalizeError(error)
  
      return {
        data:   where,
        before: refine?.returnBefore ? before : undefined,
      }
    }
  
    // ----------------------------------------------------------
    // Batch
    // Supabase لا يدعم mixed batch — نُنفّذ كل op منفصلة
    // لكن creates يمكن تجميعها في insert واحد
    // ----------------------------------------------------------
  
    async batch(ops: LBatchOp[]): Promise<LBatchResult[]> {
      const results: LBatchResult[] = []
  
      for (const op of ops) {
        try {
          if (op.op === 'create') {
            const result = await this.create(op.list, op.data)
            results.push({ status: 'fulfilled', data: result.data })
  
          } else if (op.op === 'update') {
            const result = await this.update(op.list, op.where, op.data)
            results.push({ status: 'fulfilled', data: result.data })
  
          } else if (op.op === 'delete') {
            await this.delete(op.list, op.where)
            results.push({ status: 'fulfilled', data: op.where })
          }
        } catch (e) {
          results.push({
            status: 'rejected',
            error:  e as LDriverError,
          })
        }
      }
  
      return results
    }
  
    // ----------------------------------------------------------
    // Transactions
    // Supabase لا يدعم client-side transactions مباشرة
    // نستخدم Postgres RPC function كـ workaround
    // أو نُنفّذ عبر pg directly في server environment
    // ----------------------------------------------------------
  
    async transaction<T>(fn: (tx: IDriverTransaction) => Promise<T>): Promise<T> {
      // Supabase HTTP client لا يدعم transactions مباشرة
      // الحل: نُنفّذ الـ ops sequentially مع manual rollback إذا فشل أي منها
      const executed: Array<() => Promise<void>> = []
  
      const tx: IDriverTransaction = {
        findOne:  (list, where)        => this.findOne(list, where),
        findMany: (list, opts)         => this.findMany(list, opts).then(r => r.items),
  
        create: async (list, data, refine) => {
          const result = await this.create(list, data, refine)
          // نحفظ rollback — delete ما أنشأناه
          executed.push(() => this.delete(list, { id: result.data.id }).then(() => ({})))
          return result
        },
  
        update: async (list, where, data, refine) => {
          // نقرأ الـ before للـ rollback
          const before = await this.findOne(list, where)
          const result = await this.update(list, where, data, refine)
          // rollback — نُعيد القيم الأصلية
          if (before) executed.push(() => this.update(list, where, before).then(() => ({})))
          return result
        },
  
        delete: async (list, where, refine) => {
          const before = await this.findOne(list, where)
          const result = await this.delete(list, where, refine)
          // rollback — نُعيد الـ item
          if (before) executed.push(() => this.create(list, before).then(() => ({})))
          return result
        },
      }
  
      try {
        return await fn(tx)
      } catch (e) {
        // rollback — نُنفّذ بالعكس
        for (const rollback of executed.reverse()) {
          await rollback().catch(() => ({}))   // best effort
        }
        throw e
      }
    }
  
    // ----------------------------------------------------------
    // Realtime
    // Supabase Realtime عبر WebSocket — postgres_changes
    // ----------------------------------------------------------
  
    subscribe(
      list:     string,
      filter:   LWhereFilter | LUniqueFilter,
      callback: (event: LDriverEvent) => void,
    ): () => void {
  
      const filterStr = this.buildRealtimeFilter(filter)
  
      const channel: RealtimeChannel = this.client
        .channel(`${list}:${filterStr}`)
        .on(
          'postgres_changes',
          {
            event:  '*',
            schema: 'public',
            table:  list,
            filter: filterStr,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              callback({ type: 'created', data: payload.new as Record<string, unknown> })
            } else if (payload.eventType === 'UPDATE') {
              callback({
                type: 'updated',
                data: payload.new  as Record<string, unknown>,
                prev: payload.old  as Record<string, unknown>,
              })
            } else if (payload.eventType === 'DELETE') {
              callback({ type: 'deleted', id: (payload.old as Record<string, unknown>).id })
            }
          },
        )
        .subscribe((status) => {
          // أول snapshot — Supabase لا يُرسل snapshot تلقائياً
          // Core يطلب findMany منفصلة للحالة الأولية
          if (status === 'SUBSCRIBED') {
            this.findMany(list, { where: filter as LWhereFilter })
              .then(({ items }) => callback({ type: 'snapshot', data: items }))
              .catch(() => ({}))
          }
        })
  
      return () => {
        this.client.removeChannel(channel)
      }
    }
  
    // ----------------------------------------------------------
    // Query Builder
    // ----------------------------------------------------------
  
    private applyFilter(q: any, filter: LWhereFilter | LUniqueFilter): any {
      for (const [field, condition] of Object.entries(filter)) {
        if (field === 'AND') {
          for (const sub of condition as LWhereFilter[]) q = this.applyFilter(q, sub)
          continue
        }
        if (field === 'OR') {
          // Supabase يدعم OR عبر .or()
          const orStr = (condition as LWhereFilter[])
            .map(sub => this.filterToOrString(sub))
            .join(',')
          q = q.or(orStr)
          continue
        }
        if (field === 'NOT') {
          // NOT — نُطبّق neq على كل field
          const sub = condition as LWhereFilter
          for (const [f, v] of Object.entries(sub)) q = q.neq(f, v)
          continue
        }
  
        if (condition && typeof condition === 'object') {
          const f = condition as Record<string, unknown>
  
          if ('eq'       in f) q = q.eq(field,   f.eq)
          if ('neq'      in f) q = q.neq(field,  f.neq)
          if ('gt'       in f) q = q.gt(field,   f.gt)
          if ('gte'      in f) q = q.gte(field,  f.gte)
          if ('lt'       in f) q = q.lt(field,   f.lt)
          if ('lte'      in f) q = q.lte(field,  f.lte)
          if ('in'       in f) q = q.in(field,   f.in as unknown[])
          if ('notIn'    in f) q = q.not(field, 'in', `(${(f.notIn as unknown[]).join(',')})`)
          if ('contains' in f) q = q.ilike(field, `%${f.contains}%`)
        } else {
          // { id: '1' } — direct equality
          q = q.eq(field, condition)
        }
      }
      return q
    }
  
    private applySort(q: any, sort: LSortFilter): any {
      for (const [field, dir] of Object.entries(sort)) {
        q = q.order(field, { ascending: dir === 'asc' })
      }
      return q
    }
  
    private applyCursor(q: any, cursor: LCursor, sort?: LSortFilter): any {
      const dir = sort?.[cursor.field] ?? 'asc'
      return dir === 'asc'
        ? q.gt(cursor.field, cursor.value)
        : q.lt(cursor.field, cursor.value)
    }
  
    private filterToOrString(filter: LWhereFilter): string {
      return Object.entries(filter)
        .map(([field, condition]) => {
          if (condition && typeof condition === 'object') {
            const f = condition as Record<string, unknown>
            if ('eq'  in f) return `${field}.eq.${f.eq}`
            if ('gt'  in f) return `${field}.gt.${f.gt}`
            if ('gte' in f) return `${field}.gte.${f.gte}`
            if ('lt'  in f) return `${field}.lt.${f.lt}`
            if ('lte' in f) return `${field}.lte.${f.lte}`
          }
          return `${field}.eq.${condition}`
        })
        .join(',')
    }
  
    // Supabase Realtime filter format: "field=eq.value"
    private buildRealtimeFilter(filter: LWhereFilter | LUniqueFilter): string {
      const entries = Object.entries(filter).filter(([k]) => !['AND', 'OR', 'NOT'].includes(k))
      if (!entries.length) return ''
  
      const [field, condition] = entries[0]
  
      if (condition && typeof condition === 'object') {
        const f = condition as Record<string, unknown>
        if ('eq' in f) return `${field}=eq.${f.eq}`
      }
  
      return `${field}=eq.${condition}`
    }
  
    // ----------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------
  
    private extractGeneratedFields(entity: Record<string, unknown>): Record<string, unknown> {
      // يُرجع فقط الـ fields التي ولّدها الـ driver/db
      // id, createdAt, updatedAt, autoIncrement
      const generated: Record<string, unknown> = {}
      if ('id'        in entity) generated.id        = entity.id
      if ('createdAt' in entity) generated.createdAt = entity.createdAt
      if ('updatedAt' in entity) generated.updatedAt = entity.updatedAt
      return generated
    }
  
    // ----------------------------------------------------------
    // Error Normalization
    // ----------------------------------------------------------
  
    private normalizeError(error: PostgrestError): LDriverError {
      const code = error.code
  
      if (code === 'PGRST116')  return this.buildError('DB/NOT_FOUND',      error.message)
      if (code === '23505')     return this.buildError('DB/DUPLICATE',       error.message)
      if (code === '23503')     return this.buildError('DB/CONSTRAINT',      error.message)
      if (code === '57014')     return this.buildError('DB/TIMEOUT',         error.message)
      if (code === '08000' ||
          code === '08006')     return this.buildError('DRIVER/CONNECTION',  error.message)
  
      return this.buildError('DRIVER/UNKNOWN', error.message, error)
    }
  
    private buildError(
      code:           LDriverErrorCode,
      message:        string,
      originalError?: unknown,
    ): LDriverError {
      return { code, message, originalError }
    }
  
  }