import { Simplify } from './helpers';
import { LEntrieItem } from './entrie';
import { TSchemaRef } from '../schema';

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

type FieldOps<T> = T extends string
  ? StringOps | string
  : T extends number
    ? NumberOps | number
    : T extends boolean
      ? BooleanOps | boolean
      : T extends Date
        ? DateOps | Date
        : never;

// ============================================================
// 🧭 PATH SYSTEM
// ============================================================

type Join<K, P> = K extends string
  ? P extends string
    ? `${K}.${P}`
    : never
  : never;

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

type Builtin = Primitive | Date | RegExp | Map<any, any> | Set<any>;

type Prev = [never, 0, 1, 2, 3, 4, 5];

export type PathsKeys<T, D extends number = 5> = [D] extends [never]
  ? never
  : T extends Builtin
    ? never
    : T extends Array<infer U>
      ? PathsKeys<U, D>
      : {
          [K in keyof T & string]: K | Join<K, PathsKeys<T[K], Prev[D]>>;
        }[keyof T & string];

type PathValue<T, P extends string> = P extends `${infer K}.${infer R}`
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
  [P in PathsKeys<Infer<T>>]?: FieldOps<PathValue<Infer<T>, P>>;
};

type WhereLogical<T> = {
  intersect?: InferWhereInput<T>[];
  union?: InferWhereInput<T>[];
  exclude?: InferWhereInput<T>[];
};

export type InferWhereInput<T> = Simplify<WhereFields<T> & WhereLogical<T>>;

export type LWhere<S extends TSchemaRef> = InferWhereInput<z.output<S['schema']>>;

