// ============================================================
// 🏗️ TYPE-LEVEL ORM SCHEMA ENGINE (FINAL CLEAN VERSION)
// ============================================================

// ----------------------------------
// 🧩 META
// ----------------------------------

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

// ----------------------------------
// 🧱 BASE TYPES (IMPORTANT FIX)
// ----------------------------------

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

type Builtin = Primitive | Date  | RegExp | Map<any, any> | Set<any>;

// ----------------------------------
// 🧹 CLEAN TYPES
// ----------------------------------

type ExcludeUnionMark<T> = Exclude<T, TMeta>;

// ❗ FIX: prevent Date/object explosion
type DeepClean<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
    ? DeepClean<U>[]
    : T extends object
      ? { [K in keyof T]: DeepClean<T[K]> }
      : T;

// ----------------------------------
// 🔍 META DETECTION (FIXED)
// ----------------------------------

type MetaOf<T> = Extract<T, TMeta>;

// ❗ FIX: never bug
type HasMeta<T, M extends keyof TMeta> = [MetaOf<T>] extends [never]
  ? false
  : MetaOf<T> extends { [K in M]: any }
    ? true
    : false;

// multiple metas support
type HasSomeMeta<T, M extends keyof TMeta> = [MetaOf<T>] extends [never]
  ? false
  : true extends {
        [K in M]: HasMeta<T, K>;
      }[M]
    ? true
    : false;

// ----------------------------------
// 📦 FIELD EXTRACTION
// ----------------------------------

type ExtractFields<T, M extends keyof TMeta> = DeepClean<{
  [K in keyof T as HasMeta<T[K], M> extends true ? K : never]: ExcludeUnionMark<
    T[K]
  >;
}>;

// fields with multiple meta types
type ExtractFieldsByMeta<T, M extends keyof TMeta> = DeepClean<{
  [K in keyof T as HasSomeMeta<T[K], M> extends true
    ? K
    : never]: ExcludeUnionMark<T[K]>;
}>;

// ----------------------------------
// 🔗 RELATIONS
// ----------------------------------


type UnwrapArray<T> = T extends Array<infer U> ? U : T;
// استخرج الـ meta جزء من الـ union
type RelationMetaOf<T> = Extract<T, { oneFrom: true } | { manyFrom: true }>;

// تحقق هل فيه relation meta
type HasRelation<T> = [RelationMetaOf<T>] extends [never] ? false : true;

// استخرج القيمة الفعلية (بدون الـ meta)
type ExtractRelationValue<T> = Exclude<T, TMeta>;

type ExtractRelations<T> = {
  [K in keyof T as HasRelation<T[K]> extends true ? K : never]: RelationMetaOf<
    T[K]
  > extends { manyFrom: true }
    ? DecomposeSchema<UnwrapArray<ExtractRelationValue<T[K]>>>[]
    : DecomposeSchema<ExtractRelationValue<T[K]>>;
};

// ----------------------------------
// ⚙️ AUTOGEN
// ----------------------------------

type AutoGenGroup<T> = {
  onCreate: ExtractFieldsByMeta<T, 'autogen' | 'now'>;
  onUpdate: ExtractFieldsByMeta<T, 'updatedAt'>;
};

// ----------------------------------
// 🧠 BASE (FIELDS WITHOUT META)
// ----------------------------------

type ExtractBase<T> = DeepClean<{
  [K in keyof T as HasSomeMeta<T[K], keyof TMeta> extends false
    ? K
    : never]: T[K];
}>;

// ----------------------------------
// 🧠 FINAL DECOMPOSE
// ----------------------------------


export type DecomposeSchema<T> = {
  base: ExtractBase<T>;

  idFields: ExtractFields<T, 'idField'>;
  uniqueFields: ExtractFields<T, 'unique'>;
  indexFields: ExtractFields<T, 'index'>;

  populateQraph: ExtractRelations<T>;
  autogenFields: AutoGenGroup<T>;
};

