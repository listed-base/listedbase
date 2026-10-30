import { ZodObject } from 'zod/v4';
import { z } from 'zod/v4';
import { getPrimarySource } from '@listedbase/driver-abstract';
import { LInfer } from '../infers';
import { LQueryRef } from '../query/query';
import { LError } from '../error';
import {
  MutationIntent,
  RefineOptions,
  InferMutationResult,
  InferGroupMutationResult,
  ManyResult,
  SettledResult,
} from './mutations';

// Codec transformer
export class LCodec {
  static encode(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const result = Array.isArray(data) ? [...data] : { ...data };
    for (const key of Object.keys(result)) {
      if (result[key] instanceof Date) {
        result[key] = result[key].toISOString();
      } else if (typeof result[key] === 'object') {
        result[key] = LCodec.encode(result[key]);
      }
    }
    return result;
  }

  static decode(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const result = Array.isArray(data) ? [...data] : { ...data };
    for (const key of Object.keys(result)) {
      if (typeof result[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result[key])) {
        result[key] = new Date(result[key]);
      } else if (typeof result[key] === 'object') {
        result[key] = LCodec.decode(result[key]);
      }
    }
    return result;
  }
}

export function list<S extends ZodObject<any>>(query: LQueryRef<S>) {
  const schema = query.schema;
  const listName = schema.meta()?.id as string;
  type Infers = LInfer<S>;

  const getDriver = () => {
    const source = getPrimarySource();
    const driver = source.data;
    const schemas = z.toJSONSchema(z.globalRegistry);
    driver.ensureReady(schemas);
    return driver;
  };

  const applySelect = (item: any, select?: any) => {
    if (!select || !select.pick) return item;
    const picked: any = {};
    for (const key of select.pick) {
      if (key in item) picked[key] = item[key];
    }
    return picked;
  };

  const normalizeWhere = (where: any, driver: any) => {
    if (where && typeof where === 'object') {
      const normalized: any = {};
      for (const [key, value] of Object.entries(where)) {
        normalized[key] = key === 'id' ? driver.serializeId(value) : value;
      }
      return normalized;
    }
    return driver.serializeId(where);
  };

  const formatResult = (
    beforeItem: any,
    afterItem: any,
    intent?: MutationIntent,
    select?: any,
    defaultIntent: MutationIntent = 'entity'
  ): any => {
    const activeIntent = intent || defaultIntent;
    if (activeIntent === 'confirm') return true;
    if (activeIntent === 'id') return driver.serializeId(afterItem?.id || beforeItem?.id);
    if (activeIntent === 'diff') {
      return {
        before: beforeItem ? applySelect(LCodec.decode(beforeItem), select) : null,
        after: afterItem ? applySelect(LCodec.decode(afterItem), select) : null,
      };
    }
    // 'entity'
    return applySelect(LCodec.decode(afterItem || beforeItem), select);
  };

  return {
    // Single / Array Create
    async create<
      Input extends Infers['createInput'] | Infers['createInput'][],
      I extends MutationIntent | undefined = undefined,
      Ref extends RefineOptions<S, I> | undefined = undefined
    >(
      input: Input,
      refine?: Ref
    ): Promise<
      Input extends any[]
        ? InferGroupMutationResult<S, I, Ref>
        : InferMutationResult<S, I, Ref>
    > {
      const driver = getDriver();
      const isArray = Array.isArray(input);
      const itemsToProcess = isArray ? (input as any[]) : [input];

      // Atomicity check for rejectAll
      if (isArray && !driver.capabilities.transactions && refine?.errorMode !== 'settled') {
        throw new LError({
          code: 'DRIVER/UNSUPPORTED',
          message: 'Array operations with rejectAll errorMode require driver transaction support.',
        });
      }

      const results: any[] = [];

      for (const rawItem of itemsToProcess) {
        try {
          const itemWithDefaults = {
            id: rawItem.id || crypto.randomUUID(),
            createdAt: rawItem.createdAt || new Date(),
            ...rawItem,
          };

          const parsed = schema.parse(itemWithDefaults);
          const encoded = LCodec.encode(parsed);
          const createdRaw = await driver.create(listName, encoded);

          const formatted = formatResult(null, createdRaw || encoded, refine?.intent, refine?.select);

          if (refine?.errorMode === 'settled') {
            results.push({ status: 'fulfilled', data: formatted });
          } else {
            results.push(formatted);
          }
        } catch (err: any) {
          const lErr =
            err instanceof LError
              ? err
              : new LError({
                  code: 'DB/DUPLICATE',
                  message: err.message || 'Create operation failed.',
                  cause: err,
                });

          if (refine?.errorMode === 'settled') {
            results.push({ status: 'rejected', error: lErr });
          } else {
            throw lErr;
          }
        }
      }

      return (isArray ? results : results[0]) as any;
    },

    // Single / Array Update
    async update<
      Opts extends
        | { where: Infers['uniqueArgs']; input: Infers['updateInput'] }
        | Array<{ where: Infers['uniqueArgs']; input: Infers['updateInput'] }>,
      I extends MutationIntent | undefined = undefined,
      Ref extends RefineOptions<S, I> | undefined = undefined
    >(
      opts: Opts,
      refine?: Ref
    ): Promise<
      Opts extends any[]
        ? InferGroupMutationResult<S, I, Ref>
        : InferMutationResult<S, I, Ref>
    > {
      const driver = getDriver();
      const isArray = Array.isArray(opts);
      const itemsToProcess = isArray ? (opts as any[]) : [opts];

      if (isArray && !driver.capabilities.transactions && refine?.errorMode !== 'settled') {
        throw new LError({
          code: 'DRIVER/UNSUPPORTED',
          message: 'Array operations with rejectAll errorMode require driver transaction support.',
        });
      }

      const results: any[] = [];

      for (const itemOpt of itemsToProcess) {
        try {
          const normalizedWhere = normalizeWhere(itemOpt.where, driver);
          const beforeRaw = await driver.findUnique(listName, normalizedWhere);
          if (!beforeRaw) {
            throw new LError({
              code: 'DB/NOT_FOUND',
              message: `Record not found for update.`,
            });
          }

          const updateData = {
            ...itemOpt.input,
            updatedAt: new Date(),
          };

          const encodedInput = LCodec.encode(updateData);
          const updatedRaw = await driver.update(listName, normalizedWhere, encodedInput);

          const formatted = formatResult(
            beforeRaw,
            updatedRaw || { ...beforeRaw, ...encodedInput },
            refine?.intent,
            refine?.select,
            'entity'
          );

          if (refine?.errorMode === 'settled') {
            results.push({ status: 'fulfilled', data: formatted });
          } else {
            results.push(formatted);
          }
        } catch (err: any) {
          const lErr =
            err instanceof LError
              ? err
              : new LError({
                  code: 'DB/NOT_FOUND',
                  message: err.message || 'Update operation failed.',
                  cause: err,
                });

          if (refine?.errorMode === 'settled') {
            results.push({ status: 'rejected', error: lErr });
          } else {
            throw lErr;
          }
        }
      }

      return (isArray ? results : results[0]) as any;
    },

    // Single / Array Delete
    async delete<
      Where extends Infers['uniqueArgs'] | Infers['uniqueArgs'][],
      I extends MutationIntent | undefined = undefined,
      Ref extends RefineOptions<S, I> | undefined = undefined
    >(
      where: Where,
      refine?: Ref
    ): Promise<
      Where extends any[]
        ? InferDeleteGroupMutationResult<S, I, Ref>
        : InferDeleteMutationResult<S, I, Ref>
    > {
      const driver = getDriver();
      const isArray = Array.isArray(where);
      const itemsToProcess = isArray ? (where as any[]) : [where];

      if (isArray && !driver.capabilities.transactions && refine?.errorMode !== 'settled') {
        throw new LError({
          code: 'DRIVER/UNSUPPORTED',
          message: 'Array operations with rejectAll errorMode require driver transaction support.',
        });
      }

      const results: any[] = [];

      for (const whereItem of itemsToProcess) {
        try {
          const normalizedWhere = normalizeWhere(whereItem, driver);
          const beforeRaw = await driver.findUnique(listName, normalizedWhere);
          if (!beforeRaw) {
            throw new LError({
              code: 'DB/NOT_FOUND',
              message: `Record not found for delete.`,
            });
          }

          await driver.delete(listName, normalizedWhere);

          const formatted = formatResult(beforeRaw, null, refine?.intent, refine?.select, 'confirm');

          if (refine?.errorMode === 'settled') {
            results.push({ status: 'fulfilled', data: formatted });
          } else {
            results.push(formatted);
          }
        } catch (err: any) {
          const lErr =
            err instanceof LError
              ? err
              : new LError({
                  code: 'DB/NOT_FOUND',
                  message: err.message || 'Delete operation failed.',
                  cause: err,
                });

          if (refine?.errorMode === 'settled') {
            results.push({ status: 'rejected', error: lErr });
          } else {
            throw lErr;
          }
        }
      }

      return (isArray ? results : results[0]) as any;
    },

    // Upsert (Types only in Phase 3)
    async upsert(opts: any, refine?: any): Promise<any> {
      throw new LError({
        code: 'DRIVER/UNSUPPORTED',
        message: 'upsert is not supported in Phase 3 runtime.',
      });
    },

    // UpdateMany (Types only in Phase 3)
    async updateMany(opts: any, refine?: any): Promise<ManyResult> {
      throw new LError({
        code: 'DRIVER/UNSUPPORTED',
        message: 'updateMany is not supported in Phase 3 runtime.',
      });
    },

    // DeleteMany (Types only in Phase 3)
    async deleteMany(opts: any, refine?: any): Promise<ManyResult> {
      throw new LError({
        code: 'DRIVER/UNSUPPORTED',
        message: 'deleteMany is not supported in Phase 3 runtime.',
      });
    },
  };
}
