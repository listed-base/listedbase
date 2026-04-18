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
// 🔗 PopS
// ----------------------------------


type UnwrapArray<T> = T extends Array<infer U> ? U : T;
// استخرج الـ meta جزء من الـ union
type PopMetaOf<T> = Extract<T, { oneFrom: true } | { manyFrom: true }>;

// تحقق هل فيه Pop meta
type HasPop<T> = [PopMetaOf<T>] extends [never] ? false : true;

// استخرج القيمة الفعلية (بدون الـ meta)
type ExtractPopValue<T> = Exclude<T, TMeta>;

type ExtractPops<T> = {
  [K in keyof T as HasPop<T[K]> extends true ? K : never]: PopMetaOf<
    T[K]
  > extends { manyFrom: true }
    ? MappingSchema<UnwrapArray<ExtractPopValue<T[K]>>>[]
    : MappingSchema<ExtractPopValue<T[K]>>;
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
// 🧠 FINAL Mapping
// ----------------------------------


export type MappingSchema<T> = {
  base: ExtractBase<T>;

  idFields: ExtractFields<T, 'idField'>;
  uniqueFields: ExtractFields<T, 'unique'>;
  indexFields: ExtractFields<T, 'index'>;

  populateQraph: ExtractPops<T>;
  autogenFields: AutoGenGroup<T>;
};

