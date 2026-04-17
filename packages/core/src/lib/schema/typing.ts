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

type Builtin = Primitive | Date | Function | RegExp | Map<any, any> | Set<any>;

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

type IsArray<T> = T extends Array<any> ? true : false;

type UnwrapArray<T> = T extends Array<infer U> ? U : T;
type HasRelation<T> = T extends { oneFrom: true } | { manyFrom: true }
  ? true
  : false;
type ResolveRelation<T> =
  IsArray<T> extends true
    ? DecomposeSchema<UnwrapArray<T>>[]
    : DecomposeSchema<T>;

type ExtractRelations<T> = {
  [K in keyof T as HasRelation<T[K]> extends true ? K : never]: T[K] extends {
    manyFrom: true;
  }
    ? DecomposeSchema<T[K] extends { manyFrom: true } ? T[K] : never>[]
    : DecomposeSchema<T[K] extends { oneFrom: true } ? T[K] : never>;
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

type MetaNameMap = {
  idField: 'idFields';
  unique: 'uniqueFields';
  index: 'indexFields';
};

type MetaKeys = keyof MetaNameMap;

export type DecomposeSchema<T> = {
  base: ExtractBase<T>;
} & {
  idFields: ExtractFields<T, "idField">;
  uniqueFields: ExtractFields<T, "unique">;
  indexFields: ExtractFields<T, "index">;

  populateQraph: ExtractRelations<T>;
  autogenFields: AutoGenGroup<T>;
};

type Post = {
  id: number | { idField: true };
  title: string;
};

interface Profile {
  id: string | { idField: true };
  bio: string;
}

type User = {
  id: number | { idField: true; autogen: true };
  name: string;
  tags: string[];
  obj: {
    a: number;
    b: string;
  };
  createdAt: Date | { now: true };
  updatedAt: Date | { updatedAt: true };

  email: string | { unique: true };

  profile: Profile | { oneFrom: true };
  posts: Post[] | { manyFrom: true };
};

type Result = DecomposeSchema<User>['populateQraph'];
type populateQraph = DecomposeSchema<User>['populateQraph'];
