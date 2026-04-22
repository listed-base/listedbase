// ============================================================
// 🧰 INFERS HELPERS
// ============================================================

export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type RequireAtLeastOne<T> = {
  [K in keyof T]: Pick<T, K> & Partial<Record<Exclude<keyof T, K>, never>>;
}[keyof T];

export type ExactlyOne<T> = {
  [K in keyof T]: {
    [P in K]: T[P];
  } & Partial<Record<Exclude<keyof T, K>, never>>;
}[keyof T];

// ----------------------------------
// ARRAY / OBJECT HELPERS
// ----------------------------------

export type UnwrapArray<T> = T extends Array<infer U> ? U : T;

// ----------------------------------
// SCHEMA ACCESS HELPERS
// ----------------------------------

export type ExtractSchema<T> =
  T extends { __schema: infer S } ? S : never;