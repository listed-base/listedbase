// meta.ts
import { EmptyObject } from '../utils';
import { z } from 'zod/v4';

// ============================================================
// 🏷️ META FLAGS
// ============================================================

export interface TMetaFlags {
  idField?: true;
  unique?: true;
  index?: true;
  autoIncrement?: true,
  autogen?: true;
  now?: true;
  updatedAt?: true;
  oneFrom?: true;
  manyFrom?: true;
}

// ============================================================
// 🔗 BRANDED FIELD
// ============================================================

export type Branded<T, TMeta extends TMetaFlags> = T & {
  readonly __lMeta: TMeta;
};

export function brandMeta<T extends z.ZodType, M extends TMetaFlags>(
  schema: T,
  meta: M,
): Branded<T, M> {
  return Object.assign(schema, { __lMeta: meta }) as Branded<
    T,
    M
  >;
}

// ============================================================
// 📖 META READERS
// ============================================================

export type FieldMeta<F> = F extends { __lMeta: infer M } ? M : EmptyObject;
export type IsId<F> = FieldMeta<F> extends { idField: true } ? true : false;
export type IsUnique<F> = FieldMeta<F> extends { unique: true } ? true : false;
export type IsIndex<F> = FieldMeta<F> extends { index: true } ? true : false;
export type IsAutogen<F> =
  FieldMeta<F> extends { autogen: true } ? true : false;
export type IsNow<F> = FieldMeta<F> extends { now: true } ? true : false;
export type IsUpdatedAt<F> =
  FieldMeta<F> extends { updatedAt: true } ? true : false;
export type IsOneFrom<F> =
  FieldMeta<F> extends { oneFrom: true } ? true : false;
export type IsManyFrom<F> =
  FieldMeta<F> extends { manyFrom: true } ? true : false;
export type IsRelation<F> = IsOneFrom<F> extends true ? true : IsManyFrom<F>;
export type IsAutoOnCreate<F> = IsAutogen<F> extends true ? true : IsNow<F>;
export type IsAutoOnUpdate<F> = IsUpdatedAt<F>;
