// where.ts
import { FieldOutput } from './unique';
import { Clean, IsPrimitive, NonNullable, Simplify, UnwrapObject } from '../utils';

// ============================================================
// 🔧 SCALAR OPERATORS
// ============================================================

type StringOps<T extends string> = {
  contains?:   T;
  startsWith?: T;
  endsWith?:   T;
  neq?:        T;
  in?:         T[];
  notIn?:      T[];
  isNull?:     boolean;
};

type NumberOps = {
  gt?:     number;
  gte?:    number;
  lt?:     number;
  lte?:    number;
  neq?:    number;
  in?:     number[];
  notIn?:  number[];
  isNull?: boolean;
};

type BooleanOps = {
  isNull?: boolean;
};


// ============================================================
// 🔧 FIELD FILTER
// ============================================================

type FieldFilter<T> =
  T extends string  ? T | StringOps<T> :
  T extends number  ? T | NumberOps    :
  T extends boolean ? T | BooleanOps   :
  never;

// ============================================================
// 🔧 ARRAY OPS — recursive على الـ item كاملاً
// ============================================================

type ArrayOps<T> = {
  some?:  TWhere<T>;
  every?: TWhere<T>;
  none?:  TWhere<T>;
};

// ============================================================
// 🔧 TOP-LEVEL PRIMITIVE FIELDS
// ============================================================

type TopLevelFields<T> = {
  [K in keyof T as
    IsPrimitive<NonNullable<T[K]>> extends true ? K : never
  ]?: FieldFilter<NonNullable<T[K]>>;
};

// ============================================================
// 🔧 NESTED OBJECT / ARRAY
// ============================================================

type NestedFields<T> = {
  [K in keyof T as
    IsPrimitive<NonNullable<T[K]>> extends false ? K : never
  ]?: NonNullable<T[K]> extends Array<infer U>
    ? U extends object
      ? ArrayOps<U>
      : never
    : NonNullable<T[K]> extends object
      ? TWhere<NonNullable<T[K]>>
      : never;
};

// ============================================================
// 🔧 DOT PATHS — objects only, stops at arrays
// ============================================================

// depth 1: 'address.city'
type Depth1Paths<T> = {
  [K in keyof T as
    UnwrapObject<NonNullable<T[K]>> extends never
      ? never
      : K extends string
        ? `${K}.${string & keyof UnwrapObject<NonNullable<T[K]>>}`
        : never
  ]?: K extends keyof T
    ? keyof UnwrapObject<NonNullable<T[K]>> extends infer J
      ? J extends string
        ? J extends keyof UnwrapObject<NonNullable<T[K]>>
          ? FieldFilter<NonNullable<UnwrapObject<NonNullable<T[K]>>[J]>>
          : never
        : never
      : never
    : never;
};

// depth 2: 'address.country.code'
type Depth2Paths<T> = {
  [Path in
    { [A in keyof T]:
        UnwrapObject<NonNullable<T[A]>> extends infer TA
          ? [TA] extends [never] ? never
          : A extends string
            ? { [B in keyof TA]:
                  UnwrapObject<NonNullable<TA[B]>> extends infer TB
                    ? [TB] extends [never] ? never
                    : B extends string
                      ? `${A}.${B}.${string & keyof TB}`
                      : never
                    : never
              }[keyof TA]
          : never
          : never
    }[keyof T]
  ]?: Path extends `${infer A}.${infer B}.${infer C}`
    ? A extends keyof T
      ? UnwrapObject<NonNullable<T[A]>> extends infer TA
        ? B extends keyof TA
          ? UnwrapObject<NonNullable<TA[B]>> extends infer TB
            ? C extends keyof TB
              ? FieldFilter<NonNullable<TB[C]>>
              : never
            : never
          : never
        : never
      : never
    : never;
};

// depth 3: 'a.b.c.d'
type Depth3Paths<T> = {
  [Path in
    { [A in keyof T]:
        UnwrapObject<NonNullable<T[A]>> extends infer TA
          ? [TA] extends [never] ? never
          : A extends string
            ? { [B in keyof TA]:
                  UnwrapObject<NonNullable<TA[B]>> extends infer TB
                    ? [TB] extends [never] ? never
                    : B extends string
                      ? { [C in keyof TB]:
                            UnwrapObject<NonNullable<TB[C]>> extends infer TC
                              ? [TC] extends [never] ? never
                              : C extends string
                                ? `${A}.${B}.${C}.${string & keyof TC}`
                                : never
                              : never
                        }[keyof TB]
                      : never
                    : never
              }[keyof TA]
          : never
          : never
    }[keyof T]
  ]?: Path extends `${infer A}.${infer B}.${infer C}.${infer D}`
    ? A extends keyof T
      ? UnwrapObject<NonNullable<T[A]>> extends infer TA
        ? B extends keyof TA
          ? UnwrapObject<NonNullable<TA[B]>> extends infer TB
            ? C extends keyof TB
              ? UnwrapObject<NonNullable<TB[C]>> extends infer TC
                ? D extends keyof TC
                  ? FieldFilter<NonNullable<TC[D]>>
                  : never
                : never
              : never
            : never
          : never
        : never
      : never
    : never;
};

// ============================================================
// 🔗 LOGICAL FIELDS
// ============================================================

type LogicalFields<T> = {
  $and?: TWhere<T>[];
  $or?:  TWhere<T>[];
  $not?: TWhere<T>;
};

// ============================================================
// 🔥 TWhere
// ============================================================

export type TWhere<T> = Clean<Simplify<
  TopLevelFields<T>       &
  NestedFields<T>         &
  Depth1Paths<T>          &
  Partial<Depth2Paths<T>> &
  Partial<Depth3Paths<T>> &
  LogicalFields<T>
>>;

// ============================================================
// 🔥 LOGICAL FUNCTIONS
// ============================================================

export function intersect<T>(
  ...conditions: TWhere<T>[]
): TWhere<T> {
  return { $and: conditions } as TWhere<T>;
}

export function union<T>(
  ...conditions: TWhere<T>[]
): TWhere<T> {
  return { $or: conditions } as TWhere<T>;
}

export function exclude<T>(
  ...conditions: TWhere<T>[]
): TWhere<T> {
  return { $not: conditions[0] } as TWhere<T>;
}


// ============================================================
// 🔑 WHERE FILTER — يستعمل TWhere على الـ output type
// ============================================================

export type InferWhereArgs<T> = TWhere<{
  [K in keyof T]: FieldOutput<T[K]>;
}>;