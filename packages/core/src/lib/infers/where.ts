import { FieldOutput } from './unique';
import { IsPrimitive, NonNullable } from '../utils';

// Simplified Field Filter
type ScalarOps<T> = T extends string ? { contains?: T; startsWith?: T; endsWith?: T; neq?: T; in?: T[]; notIn?: T[]; isNull?: boolean } :
                    T extends number ? { gt?: number; gte?: number; lt?: number; lte?: number; neq?: number; in?: number[]; notIn?: number[]; isNull?: boolean } :
                    T extends boolean ? { isNull?: boolean } : never;

type FieldFilter<T> = T | ScalarOps<T>;

// Recursive Nested Where
export type TWhere<T> = {
  [K in keyof T]?:
    IsPrimitive<NonNullable<T[K]>> extends true
      ? FieldFilter<NonNullable<T[K]>>
      : NonNullable<T[K]> extends Array<infer U>
        ? { some?: TWhere<U>; every?: TWhere<U>; none?: TWhere<U> }
        : TWhere<NonNullable<T[K]>>;
} & {
  $and?: TWhere<T>[];
  $or?: TWhere<T>[];
  $not?: TWhere<T>;
};

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

export type InferWhereArgs<T> = TWhere<{
  [K in keyof T]: FieldOutput<T[K]>;
}>;
