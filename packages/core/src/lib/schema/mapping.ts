import {
  DeepClean,
} from './utils';

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

// ----------------------------------
// 🔍 META DETECTION
// ----------------------------------

type MetaOf<T> = Extract<T, TMeta>;

type HasMeta<T, M extends keyof TMeta> =
  [MetaOf<T>] extends [never]
    ? false
    : MetaOf<T> extends { [K in M]: any }
      ? true
      : false;

type HasSomeMeta<T, M extends keyof TMeta> =
  [MetaOf<T>] extends [never]
    ? false
    : true extends {
        [K in M]: HasMeta<T, K>;
      }[M]
      ? true
      : false;

// ----------------------------------
// 📦 FIELD EXTRACTION
// ----------------------------------

type ExcludeUnionMark<T> = Exclude<T, TMeta>;

type ExtractFields<T, M extends keyof TMeta> = DeepClean<{
  [K in keyof T as HasMeta<T[K], M> extends true ? K : never]:
    ExcludeUnionMark<T[K]>;
}>;

type ExtractFieldsByMeta<T, M extends keyof TMeta> = DeepClean<{
  [K in keyof T as HasSomeMeta<T[K], M> extends true ? K : never]:
    ExcludeUnionMark<T[K]>;
}>;

// ----------------------------------
// 🔗 POPULATE
// ----------------------------------

type UnwrapArray<T> = T extends Array<infer U> ? U : T;

type PopulateMetaOf<T> = Extract<T, { oneFrom: true } | { manyFrom: true }>;

type HasPopulate<T> =
  [PopulateMetaOf<T>] extends [never] ? false : true;

type ExtractPopulateValue<T> = Exclude<T, TMeta>;

type ExtractPopulates<T> = {
  [K in keyof T as HasPopulate<T[K]> extends true ? K : never]:
    PopulateMetaOf<T[K]> extends { manyFrom: true }
      ? MappingSchema<UnwrapArray<ExtractPopulateValue<T[K]>>>[]
      : MappingSchema<ExtractPopulateValue<T[K]>>;
};

// ----------------------------------
// ⚙️ AUTOGEN
// ----------------------------------

type AutoGenGroup<T> = {
  onCreate: ExtractFieldsByMeta<T, 'autogen' | 'now'>;
  onUpdate: ExtractFieldsByMeta<T, 'updatedAt'>;
};

// ----------------------------------
// 🧠 BASE
// ----------------------------------

type ExtractBase<T> = DeepClean<{
  [K in keyof T as HasSomeMeta<T[K], keyof TMeta> extends false
    ? K
    : never]: T[K];
}>;

// ----------------------------------
// 🧠 FINAL
// ----------------------------------

export type MappingSchema<T> = {
  __schema: T;

  base: ExtractBase<T>;

  idFields: ExtractFields<T, 'idField'>;
  uniqueFields: ExtractFields<T, 'unique'>;
  indexFields: ExtractFields<T, 'index'>;

  populateQraph: ExtractPopulates<T>;
  autogenFields: AutoGenGroup<T>;
};