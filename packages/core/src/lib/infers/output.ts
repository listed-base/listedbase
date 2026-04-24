// output.ts

import type { TSelectRaw } from "./select";
import type { EmptyObject, Simplify } from "../utils";

// ============================================================
// 🔧 APPLY BASE SELECTION
// ============================================================

type ApplyPick<TEntity, R> =
  R extends { pick: readonly (infer K)[] }
    ? K extends keyof TEntity
      ? { [P in K]: TEntity[P] }
      : never
    : never;

type ApplyOmit<TEntity, R> =
  R extends { omit: readonly (infer K)[] }
    ? K extends keyof TEntity
      ? { [P in Exclude<keyof TEntity, K>]: TEntity[P] }
      : never
    : never;

type ApplyPluck<TEntity, R> =
  R extends { pluck: infer K }
    ? K extends keyof TEntity
      ? { [P in K]: TEntity[P] }
      : never
    : never;

type ApplyBaseSelection<TEntity, R> =
  R extends { pluck: any }
    ? ApplyPluck<TEntity, R>
    : R extends { pick: any }
      ? ApplyPick<TEntity, R>
      : R extends { omit: any }
        ? ApplyOmit<TEntity, R>
        : TEntity;

// ============================================================
// 🔧 APPLY INCLUDE
// ============================================================

type ApplyOneFromInclude<TRelated, RInclude> =
  RInclude extends { pluck: infer K }
    ? K extends keyof TRelated
      ? { [P in K]: TRelated[P] }
      : never
    : RInclude extends { pick: readonly (infer K)[] }
      ? K extends keyof TRelated
        ? { [P in K]: TRelated[P] }
        : never
      : RInclude extends { omit: readonly (infer K)[] }
        ? K extends keyof TRelated
          ? { [P in Exclude<keyof TRelated, K>]: TRelated[P] }
          : never
        : TRelated;

type ApplyManyFromInclude<TRelated, RInclude> =
  RInclude extends { pluck: infer K }
    ? K extends keyof TRelated
      ? { [P in K]: TRelated[P] }[]
      : never
    : RInclude extends { pick: readonly (infer K)[] }
      ? K extends keyof TRelated
        ? { [P in K]: TRelated[P] }[]
        : never
      : RInclude extends { omit: readonly (infer K)[] }
        ? K extends keyof TRelated
          ? { [P in Exclude<keyof TRelated, K>]: TRelated[P] }[]
          : never
        : TRelated[];

type ApplyInclude<TPopulate, R> =
  R extends { pluck: any }
    ? EmptyObject  // pluck → لا include
    : R extends { include: infer I }
      ? {
          [K in keyof I & keyof TPopulate]?:
            TPopulate[K] extends Array<infer U>
              ? ApplyManyFromInclude<U, I[K]>
              : ApplyOneFromInclude<TPopulate[K], I[K]>
        }
      : EmptyObject;

// ============================================================
// 🔥 APPLY Select
// ============================================================

// ============================================================
// 🔥 APPLY Select
// ============================================================

export type ApplySelect<
  TEntity,
  TPopulate,
  R extends TSelectRaw<any>,
> =
  R extends { pluck: infer K }
    ? K extends keyof TEntity
      ? TEntity[K]              // ← القيمة مباشرة بدون object
      : never
    : Simplify<
        ApplyBaseSelection<TEntity, R> &
        ApplyInclude<TPopulate, R>
      >;

    