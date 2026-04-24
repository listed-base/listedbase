// filters.ts — نضيف InferSortFilter

import { IsPrimitive, NonNullable, Simplify, UnwrapObject } from '../utils';

// ============================================================
// 🔑 SORT DIRECTION
// ============================================================

type SortDirection = 'asc' | 'desc';

// ============================================================
// 🔧 SORT — TOP-LEVEL PRIMITIVES
// ============================================================

type TopLevelSortFields<T> = {
  [K in keyof T as IsPrimitive<NonNullable<T[K]>> extends true
    ? K
    : never]?: SortDirection;
};

// ============================================================
// 🔧 SORT — DOT PATHS (objects only, no arrays)
// ============================================================

type SortDepth1Paths<T> = {
  [K in keyof T as UnwrapObject<NonNullable<T[K]>> extends never
    ? never
    : K extends string
      ? `${K}.${string & keyof UnwrapObject<NonNullable<T[K]>>}`
      : never]?: SortDirection;
};

type SortDepth2Paths<T> = {
  [Path in {
    [A in keyof T]: UnwrapObject<NonNullable<T[A]>> extends infer TA
      ? [TA] extends [never]
        ? never
        : A extends string
          ? {
              [B in keyof TA]: UnwrapObject<NonNullable<TA[B]>> extends infer TB
                ? [TB] extends [never]
                  ? never
                  : B extends string
                    ? `${A}.${B}.${string & keyof TB}`
                    : never
                : never;
            }[keyof TA]
          : never
      : never;
  }[keyof T]]?: SortDirection;
};

type SortDepth3Paths<T> = {
  [Path in {
    [A in keyof T]: UnwrapObject<NonNullable<T[A]>> extends infer TA
      ? [TA] extends [never]
        ? never
        : A extends string
          ? {
              [B in keyof TA]: UnwrapObject<NonNullable<TA[B]>> extends infer TB
                ? [TB] extends [never]
                  ? never
                  : B extends string
                    ? {
                        [C in keyof TB]: UnwrapObject<
                          NonNullable<TB[C]>
                        > extends infer TC
                          ? [TC] extends [never]
                            ? never
                            : C extends string
                              ? `${A}.${B}.${C}.${string & keyof TC}`
                              : never
                          : never;
                      }[keyof TB]
                    : never
                : never;
            }[keyof TA]
          : never
      : never;
  }[keyof T]]?: SortDirection;
};

// ============================================================
// 🔥 INFER SORT FILTER
// ============================================================

export type InferSortArgs<T> = Simplify<
  TopLevelSortFields<T> &
    Partial<SortDepth1Paths<T>> &
    Partial<SortDepth2Paths<T>> &
    Partial<SortDepth3Paths<T>>
>;
