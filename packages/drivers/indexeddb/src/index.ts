import {
  LDataDriver,
  LDriverCapabilities,
  FindManyOptions,
  FindManyResult,
} from '@listedbase/driver-abstract';
import { Database } from './lib/migration/db';
import { GlobalRegistryOutput } from '@listedbase/core';

class LIndexeddb extends LDataDriver {
  readonly capabilities: LDriverCapabilities = {
    schema: true,
    cursors: true,
    fullTextSearch: false,
    population: false,
    timestampGeneration: false,
    updatedAt: false,
    subscription: false,
    nativeConstraints: false,
    transactions: true,
    idGeneration: false,
    returning: true,
    batch: false,
    upsert: false,
  };

  database: Database;

  constructor(name?: string) {
    super();
    this.database = new Database(name);
  }

  protected override _init(schemas: GlobalRegistryOutput): Promise<void> {
    return this.database.openDB(schemas);
  }

  protected override async _create(list: string, input: any): Promise<any> {
    const data = await this.database.db.add(list, input);
    return data;
  }

  protected override async _update(
    list: string,
    where: any,
    input: any
  ): Promise<any> {
    const key = typeof where === 'object' ? where.id || where : where;
    const existing = await this.database.db.get(list, key);
    if (!existing) return null;
    const updated = { ...existing, ...input };
    await this.database.db.put(list, updated);
    return updated;
  }

  protected override async _delete(list: string, where: any): Promise<any> {
    const key = typeof where === 'object' ? where.id || where : where;
    const data = await this.database.db.delete(list, key);
    return data;
  }

  protected override async _findUnique(
    list: string,
    where: any
  ): Promise<any> {
    const key = typeof where === 'object' ? where.id || where : where;
    const data = await this.database.db.get(list, key);
    return data;
  }

  private matchesFilter(item: any, filter: any): boolean {
    if (!filter || typeof filter !== 'object') return true;
    for (const [key, val] of Object.entries(filter)) {
      if (key === '$and' && Array.isArray(val)) {
        if (!val.every((sub) => this.matchesFilter(item, sub))) return false;
        continue;
      }
      if (key === '$or' && Array.isArray(val)) {
        if (!val.some((sub) => this.matchesFilter(item, sub))) return false;
        continue;
      }
      if (key === '$not' && typeof val === 'object') {
        if (this.matchesFilter(item, val)) return false;
        continue;
      }

      const itemVal = item[key];
      if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
        const ops = val as any;
        if (ops.contains !== undefined && (!itemVal || !String(itemVal).includes(ops.contains))) return false;
        if (ops.startsWith !== undefined && (!itemVal || !String(itemVal).startsWith(ops.startsWith))) return false;
        if (ops.endsWith !== undefined && (!itemVal || !String(itemVal).endsWith(ops.endsWith))) return false;
        if (ops.neq !== undefined && itemVal === ops.neq) return false;
        if (ops.in !== undefined && (!Array.isArray(ops.in) || !ops.in.includes(itemVal))) return false;
        if (ops.notIn !== undefined && Array.isArray(ops.notIn) && ops.notIn.includes(itemVal)) return false;
        if (ops.gt !== undefined && (itemVal === undefined || itemVal <= ops.gt)) return false;
        if (ops.gte !== undefined && (itemVal === undefined || itemVal < ops.gte)) return false;
        if (ops.lt !== undefined && (itemVal === undefined || itemVal >= ops.lt)) return false;
        if (ops.lte !== undefined && (itemVal === undefined || itemVal > ops.lte)) return false;
        if (ops.isNull !== undefined && (itemVal === null || itemVal === undefined) !== ops.isNull) return false;
      } else {
        if (itemVal !== val) return false;
      }
    }
    return true;
  }

  protected override async _findMany(
    list: string,
    options: FindManyOptions
  ): Promise<FindManyResult> {
    const allRecords: any[] = await this.database.db.getAll(list);

    let filtered = allRecords.filter((record) => this.matchesFilter(record, options.where));

    if (options.sort && typeof options.sort === 'object') {
      const [sortField, sortDir] = Object.entries(options.sort)[0] as [string, string];
      filtered.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === valB) return 0;
        const res = valA > valB ? 1 : -1;
        return sortDir === 'desc' ? -res : res;
      });
    }

    let startIndex = 0;
    if (options.cursor) {
      const cursorKey = atob(options.cursor);
      const foundIdx = filtered.findIndex((item) => String(item.id) === cursorKey);
      if (foundIdx !== -1) {
        startIndex = foundIdx + 1;
      }
    }

    const items =
      options.take !== undefined
        ? filtered.slice(startIndex, startIndex + options.take)
        : filtered.slice(startIndex);

    let nextCursor: string | null = null;
    if (options.take !== undefined && startIndex + options.take < filtered.length) {
      const lastItem = items[items.length - 1];
      if (lastItem && lastItem.id !== undefined) {
        nextCursor = btoa(String(lastItem.id));
      }
    }

    return { items, nextCursor };
  }

  protected override async _count(list: string, where?: any): Promise<number> {
    const allRecords: any[] = await this.database.db.getAll(list);
    const filtered = allRecords.filter((record) => this.matchesFilter(record, where));
    return filtered.length;
  }
}

export function lIndexeddb(name?: string): LDataDriver {
  return new LIndexeddb(name);
}
