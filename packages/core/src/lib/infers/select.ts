// output.ts

import type { IsManyFrom, IsOneFrom, IsRelation } from "../schema/meta";
import type { ArrayItem, ZodObjectFields } from "./populate";
import type { InferSortArgs } from "./sort";
import type { FieldOutput } from "./unique";
import { InferWhereArgs } from "./where";

// ============================================================
// 🔧 BASE / RELATION SPLITTER — على الـ RAW fields
// ============================================================

// نستعمل الـ raw TFields مباشرة للتمييز
type RawBaseKeys<TRaw> = {
  [K in keyof TRaw as IsRelation<TRaw[K]> extends true ? never : K]: TRaw[K];
};

type RawRelationKeys<TRaw> = {
  [K in keyof TRaw as IsRelation<TRaw[K]> extends true ? K : never]: TRaw[K];
};

// ============================================================
// 🔧 BASE FIELD NAMES — من raw fields
// ============================================================

type BaseFieldNames<TRaw> = keyof RawBaseKeys<TRaw> & string;

type RelationFieldNames<TRaw> = keyof RawRelationKeys<TRaw> & string;

// ============================================================
// 🔧 RESOLVED OUTPUT — من raw field
// ============================================================
export type ResolvedBase<TRaw> = {
  [K in BaseFieldNames<TRaw>]: FieldOutput<TRaw[K]>;
};

export type ResolvedRelation<TRaw> = {
  [K in RelationFieldNames<TRaw>]: FieldOutput<TRaw[K]>;
};

// ============================================================
// 🔧 RELATION ITEM — unwrap array للـ manyFrom
// ============================================================

type RelationItemFromRaw<F> =
  IsOneFrom<F> extends true
    ? FieldOutput<F>
    : IsManyFrom<F> extends true
      ? FieldOutput<F> extends Array<infer U> ? U : never
      : never;

// ============================================================
// 🔧 MUTUAL EXCLUSIVITY — pick / omit / pluck
// ============================================================

export type PickConfig<TRaw> = {
  pick:   readonly BaseFieldNames<TRaw>[];
  omit?:  never;
  pluck?: never;
};

export type OmitConfig<TRaw> = {
  omit:   readonly BaseFieldNames<TRaw>[];
  pick?:  never;
  pluck?: never;
};

export type PluckConfig<TRaw> = {
  pluck:  BaseFieldNames<TRaw>;
  pick?:  never;
  omit?:  never;
};

// ============================================================
// 🔧 INCLUDE MAP — على raw relation fields
// ============================================================

type OneFromIncludeConfig<F, TChildRaw> = TSelectRaw<TChildRaw>;

type ManyFromIncludeConfig<F, TChildRaw> = TSelectRaw<TChildRaw> & {
  where?: InferWhereArgs<RelationItemFromRaw<F>>;
  sort?:  InferSortArgs<RelationItemFromRaw<F>>;
  take?:  number;
};

type IncludeMap<TRaw> = {
  [K in RelationFieldNames<TRaw>]?:
    IsOneFrom<TRaw[K]> extends true
      ? OneFromIncludeConfig<TRaw[K], ZodObjectFields<TRaw[K]>>
      : IsManyFrom<TRaw[K]> extends true
        ? ManyFromIncludeConfig<TRaw[K], ZodObjectFields<ArrayItem<TRaw[K]>>>
        : never;
};

// ============================================================
// 🔥 Select — على raw fields
// ============================================================

type PluckSelect<TRaw> = {
     pluck:    BaseFieldNames<TRaw>;
  pick?:    never;
  omit?:    never;
  include?: never;
};

type PickSelect<TRaw> = {
  pick:     readonly BaseFieldNames<TRaw>[];
  omit?:    never;
  pluck?:   never;
  include?: IncludeMap<TRaw>;
};

type OmitSelect<TRaw> = {
  omit:     readonly BaseFieldNames<TRaw>[];
  pick?:    never;
  pluck?:   never;
  include?: IncludeMap<TRaw>;
};

type IncludeOnlySelect<TRaw> = {
  pick?:    never;
  omit?:    never;
  pluck?:   never;
  include?: IncludeMap<TRaw>;
};

export type TSelectRaw<TRaw> =
  | PluckSelect<TRaw>
  | PickSelect<TRaw>
  | OmitSelect<TRaw>
  | IncludeOnlySelect<TRaw>;

// ============================================================
// 🔥 INFER Select — public type على raw TFields
// ============================================================

export type InferSelect<TRaw> = TSelectRaw<TRaw>;