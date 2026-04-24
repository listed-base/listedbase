// ============================================================
// 🧰 SHARED UTILITIES
// ============================================================

import { TMetaFlags } from "./schema/meta";

export type EmptyObject = Record<string, never>;

export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type SimplifyDeep<T> = T extends object
  ? { [K in keyof T]: SimplifyDeep<T[K]> }
  : T;

 export type NonNullable<T> = T & {};

  
export type IsPrimitive<T> =
T extends string  ? true :
T extends number  ? true :
T extends boolean ? true :
false;

export type UnwrapObject<T> =
  T extends Array<any> ? never :
  T extends object     ? T     :
  never;
// ----------------------------------
// 🧱 BASE TYPES
// ----------------------------------

export type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined;

export type Builtin = Primitive | Date | RegExp | Map<any, any> | Set<any>;

// ----------------------------------
// 🧹 CLEANING
// ----------------------------------

export type DeepClean<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
    ? DeepClean<U>[]
    : T extends object
      ? { [K in keyof T]: DeepClean<T[K]> }
      : T;

// ----------------------------------
// 🧠 TYPE HELPERS
// ----------------------------------

export type Merge<A, B> = Simplify<A & B>;

export type RemoveKeys<T, K> = Omit<T, keyof K>;

export type Prettify<T> = Simplify<T>;

export type RequireAtLeastOne<T> = {
  [K in keyof T]: Pick<T, K> & Partial<Omit<T, K>>;
}[keyof T];

export type ExactlyOne<T> = {
  [K in keyof T]: Simplify<
    { [P in K]: T[P] } &
    { [P in Exclude<keyof T, K>]?: never }
  >;
}[keyof T];

// ============================================================
// 🧩 META SYSTEM
// ============================================================

// ----------------------------------
// 🧹 META CLEANING (FINAL STEP ONLY)
// ----------------------------------

type RemoveMeta<T> = Exclude<T, TMetaFlags>;

// 🔥 FINAL CLEAN
export type Clean<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
    ? Clean<U>[]
    : T extends object
      ? {
          [K in keyof T]: Clean<RemoveMeta<T[K]>>;
        }
      : RemoveMeta<T>;
