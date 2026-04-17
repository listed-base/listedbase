// ============================================================
// 🧩 META
// ============================================================

export type TMeta = {
  idField?: true;
  unique?: true;
  index?: true;

  oneFrom?: true;
  manyFrom?: true;

  autogen?: true;

  now?: true;
  updatedAt?: true;
};

// ============================================================
// 🧱 HELPERS
// ============================================================

type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined;

type Builtin = Primitive | Date | Function | RegExp | Map<any, any> | Set<any>;

// ❗ important: prevent Date explosion
type DeepClean<T> =
  T extends Builtin
    ? T
    : T extends Array<infer U>
      ? DeepClean<U>[]
      : T extends object
        ? { [K in keyof T]: DeepClean<T[K]> }
        : T;

// ============================================================
// 🔍 META EXTRACTION (FIXED CORE)
// ============================================================

// extract ONLY object part of union
type MetaPart<T> = Extract<T, object>;

// detect meta safely
type HasMeta<T, M extends keyof TMeta> =
  MetaPart<T> extends { [K in M]: true }
    ? true
    : false;

// multiple meta support
type HasSomeMeta<T, M extends keyof TMeta> =
  true extends {
    [K in M]: HasMeta<T, K>
  }[M]
    ? true
    : false;

// remove meta part → keep base value
type BaseValue<T> = Exclude<T, TMeta>;

// ============================================================
// 📦 FIELD EXTRACTION
// ============================================================

type ExtractFields<T, M extends keyof TMeta> =
  DeepClean<{
    [K in keyof T as HasMeta<T[K], M> extends true ? K : never]:
      BaseValue<T[K]>;
  }>;

// fields with multiple meta types
type ExtractFieldsByMeta<T, M extends keyof TMeta> =
  DeepClean<{
    [K in keyof T as HasSomeMeta<T[K], M> extends true ? K : never]:
      BaseValue<T[K]>;
  }>;

// ============================================================
// 🔗 RELATIONS (FIXED)
// ============================================================

type IsRelation<T> =
  MetaPart<T> extends { oneFrom: true } | { manyFrom: true }
    ? true
    : false;

type RelationSchema<T> = Exclude<T, TMeta>;

type ResolveRelation<T> =
  T extends Array<infer U>
    ? DecomposeSchema<U>[]
    : DecomposeSchema<T>;

type ExtractRelations<T> = {
  [K in keyof T as IsRelation<T[K]> extends true ? K : never]:
    ResolveRelation<RelationSchema<T[K]>>;
};

// ============================================================
// ⚙️ AUTOGEN
// ============================================================

type AutoGenGroup<T> = {
  onCreate: ExtractFieldsByMeta<T, "autogen" | "now">;
  onUpdate: ExtractFieldsByMeta<T, "updatedAt">;
};

// ============================================================
// 🧠 BASE (NO META FIELDS)
// ============================================================

type ExtractBase<T> = DeepClean<{
  [K in keyof T as HasSomeMeta<T[K], keyof TMeta> extends false ? K : never]:
    T[K];
}>;

// ============================================================
// 🧠 FINAL
// ============================================================

type MetaNameMap = {
  idField: "idFields";
  unique: "uniqueFields";
  index: "indexFields";
};

export type DecomposeSchema<T> = {
  base: ExtractBase<T>;

  idFields: ExtractFields<T, "idField">;
  uniqueFields: ExtractFields<T, "unique">;
  indexFields: ExtractFields<T, "index">;

  populateQraph: ExtractRelations<T>;

  autogenFields: AutoGenGroup<T>;
};