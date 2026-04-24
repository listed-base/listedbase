import { FieldOutput } from './unique';
import { IsPrimitive, NonNullable, Simplify, UnwrapObject } from '../utils';

type SortDirection = 'asc' | 'desc';

type TSortRecursive<T> = {
  [K in keyof T as
    IsPrimitive<NonNullable<T[K]>> extends true ? K : never
  ]?: SortDirection;
} & {
  [K in keyof T as
    IsPrimitive<NonNullable<T[K]>> extends true
      ? never
      : UnwrapObject<NonNullable<T[K]>> extends never
        ? never
        : K
  ]?: TSortRecursive<NonNullable<T[K]>>;
};

export type InferSortArgs<T> = Simplify<TSortRecursive<{
  [K in keyof T]: FieldOutput<T[K]>;
}>>;
