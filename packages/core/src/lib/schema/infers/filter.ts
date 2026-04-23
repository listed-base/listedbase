import { Simplify } from './helpers';
import { InferItem } from './entrie';

// ============================================================
// 🧠 OPERATORS
// ============================================================

type StringOps = {
  equals?: string;
  contains?: string;
  startsWith?: string;
  endsWith?: string;
};

type NumberOps = {
  equals?: number;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
};

type DateOps = {
  equals?: Date;
  gt?: Date;
  gte?: Date;
  lt?: Date;
  lte?: Date;
};

type BooleanOps = {
  equals?: boolean;
};

type FieldOps<T> =
  T extends string ? StringOps | string :
  T extends number ? NumberOps | number :
  T extends boolean ? BooleanOps | boolean :
  T extends Date ? DateOps | Date :
  never;

// ============================================================
// 🧭 PATH SYSTEM
// ============================================================

type Join<K, P> =
  K extends string
    ? P extends string
      ? `${K}.${P}`
      : never
    : never;
type PathKeys<T> = {
  [K in keyof T]:
    T[K] extends object
      ? K | Join<K, PathKeys<T[K]>>
      : K
}[keyof T] & string;

type PathValue<T, P extends string> =
  P extends `${infer K}.${infer R}`
    ? K extends keyof T
      ? PathValue<T[K], R>
      : never
    : P extends keyof T
      ? T[P]
      : never;

// ============================================================
// 🚀 WHERE INPUT
// ============================================================

type WhereFields<T> = {
  [P in Paths<InferItem<T>>]?: FieldOps<
    PathValue<InferItem<T>, P>
  >;
};

type WhereLogical<T> = {
  intersect?: InferWhereInput<T>[];
  union?: InferWhereInput<T>[];
  exclude?: InferWhereInput<T>[];
};

export type InferWhereInput<T> = Simplify<
  WhereFields<T> &
  WhereLogical<T>
>;