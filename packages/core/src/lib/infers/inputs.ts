// inputs.ts
import type { Clean, Simplify } from '../utils';
import type {
  IsRelation,
  IsAutoOnCreate,
  IsAutoOnUpdate,
} from '../schema/meta';
import type { FieldInput, InferIdField } from './unique';
import type {
  RelationFieldsForCreate,
  RelationFieldsForUpdate,
} from './populate';

// ============================================================
// 🔑 SCALAR FIELDS
// ============================================================

type RequiredCreateFields<T> = {
  [K in keyof T as IsRelation<T[K]> extends true
    ? never
    : IsAutoOnCreate<T[K]> extends true
      ? never
      : K]: FieldInput<T[K]>;
};

type OptionalCreateFields<T> = {
  [K in keyof T as IsRelation<T[K]> extends true
    ? never
    : IsAutoOnCreate<T[K]> extends true
      ? K
      : never]?: FieldInput<T[K]>;
};

type UpdateScalarFields<T> = Partial<{
  [K in keyof T as IsRelation<T[K]> extends true
    ? never
    : IsAutoOnUpdate<T[K]> extends true
      ? never
      : K]: FieldInput<T[K]>;
}>;

// ============================================================
// 🧱 INFER CREATE — recursive via interface
// ============================================================

export type InferCreateInput<T> = Clean<
  Simplify<
    RequiredCreateFields<T> &
      OptionalCreateFields<T> &
      RelationFieldsForCreate<T>
  >
>;

// ============================================================
// 🔥 INFER UPDATEa

// ============================================================

export type InferUpdateInput<T> = Clean<
  Simplify<UpdateScalarFields<T> & Partial<RelationFieldsForUpdate<T>>>
>;

// ============================================================
// 🔥 INFER UPSERT
// ============================================================

export type InferUpsertInput<T> = Simplify<Partial<InferIdField<T>> &
  InferUpdateInput<T>>
