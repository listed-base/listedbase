// ============================================================
// 🧰 SHARED UTILITIES
// ============================================================

export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type SimplifyDeep<T> =
  T extends object
    ? { [K in keyof T]: SimplifyDeep<T[K]> }
    : T;

export type UnwrapArray<T> = T extends Array<infer U> ? U : T;

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

export type Builtin =
  | Primitive
  | Date
  | RegExp
  | Map<any, any>
  | Set<any>;

// ----------------------------------
// 🧹 CLEANING
// ----------------------------------

export type DeepClean<T> =
  T extends Builtin
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