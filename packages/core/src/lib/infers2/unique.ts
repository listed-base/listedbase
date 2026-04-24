// filters.ts
import { z } from 'zod/v4';
import { IsId, IsUnique } from '../schema/meta';
import { Clean, ExactlyOne, Simplify } from '../utils';

// ============================================================
// 📦 FIELD VALUE
// ============================================================

export type FieldOutput<F> = F extends z.ZodType ? z.output<F> : never;
export type FieldInput<F> = F extends z.ZodType ? z.input<F> : never;

// ============================================================
// 🔑 UNIQUE FILTER
// ============================================================

export type UniqueFields<T> = {
  [K in keyof T as IsId<T[K]> extends true
    ? K
    : IsUnique<T[K]> extends true
      ? K
      : never]: FieldOutput<T[K]>;
};

// get  for filed is ID  field
export type IdField<T> = {
  [K in keyof T as IsId<T[K]> extends true ? K : never]: FieldOutput<T[K]>;
};

export type InferIdField<T> = Clean<Simplify<IdField<T>>>;
export type InferIdFieldType<T> = IdField<T>[keyof IdField<T>];


export type InferUniqueArgs<T> = Clean<Simplify<ExactlyOne<UniqueFields<T>>>>;
