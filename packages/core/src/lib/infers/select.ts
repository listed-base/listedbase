import type { IsManyFrom, IsOneFrom, IsRelation } from "../schema/meta";
import type { ArrayItem, ZodObjectFields } from "./populate";
import type { InferSortArgs } from "./sort";
import type { FieldOutput } from "./unique";
import { InferWhereArgs } from "./where";

type RawBaseKeys<TRaw> = {
  [K in keyof TRaw as IsRelation<TRaw[K]> extends true ? never : K]: TRaw[K];
};

type RawRelationKeys<TRaw> = {
  [K in keyof TRaw as IsRelation<TRaw[K]> extends true ? K : never]: TRaw[K];
};

type BaseFieldNames<TRaw> = keyof RawBaseKeys<TRaw> & string;

type RelationFieldNames<TRaw> = keyof RawRelationKeys<TRaw> & string;

export type ResolvedBase<TRaw> = {
  [K in BaseFieldNames<TRaw>]: FieldOutput<TRaw[K]>;
};

export type ResolvedRelation<TRaw> = {
  [K in RelationFieldNames<TRaw>]: FieldOutput<TRaw[K]>;
};

type RelationItemFromRaw<F> =
  IsOneFrom<F> extends true
    ? FieldOutput<F>
    : IsManyFrom<F> extends true
      ? FieldOutput<F> extends Array<infer U> ? U : never
      : never;

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

export type InferSelect<TRaw> = TSelectRaw<TRaw>;
