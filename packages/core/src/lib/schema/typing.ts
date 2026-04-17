// ============================================================
// 🏗️ TYPE-LEVEL ORM SCHEMA ENGINE (FINAL DESIGN)
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
// 🧹 CLEAN TYPES
// ----------------------------------
type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined;

type Builtin =
  | Primitive
  | Date
  | Function
  | RegExp
  | Map<any, any>
  | Set<any>;

type ExcludeUnionMark<T> = Exclude<T, TMeta>;

type IsPlainObject<T> =
  T extends object
    ? T extends Builtin
      ? false
      : true
    : false;

type ExcludeUnionMarks<T> =
  IsPlainObject<T> extends true
    ? { [K in keyof T]: ExcludeUnionMarks<ExcludeUnionMark<T[K]>> }
    : T extends Array<infer U>
      ? ExcludeUnionMarks<U>[]
      : ExcludeUnionMark<T>;

// ----------------------------------
// 🔍 META DETECTION
// ----------------------------------

type MetaOf<T> = Extract<T, TMeta>;

type HasMeta<T, M extends keyof TMeta> =
  MetaOf<T> extends { [K in M]: any } ? true : false;

type HasSomeMeta<T, M extends keyof TMeta> =
  true extends {
    [K in M]: HasMeta<T, K>
  }[M]
    ? true
    : false;

// ----------------------------------
// 📦 FIELD EXTRACTION
// ----------------------------------

type ExtractFields<T, M extends keyof TMeta> =
  ExcludeUnionMarks<{
    [K in keyof T as HasMeta<T[K], M> extends true ? K : never]: T[K];
  }>;

type ExtractFieldsByMeta<T, M extends keyof TMeta> =
  ExcludeUnionMarks<{
    [K in keyof T as HasSomeMeta<T[K], M> extends true ? K : never]: T[K];
  }>;

// ----------------------------------
// 🔗 RELATION CORE (🔥 الجديد)
// ----------------------------------

// نستخرج النوع الحقيقي (نحذف meta فقط)
type FieldType<T> = ExcludeUnionMark<T>;

// نحدد هل هو array
type IsArray<T> = T extends Array<any> ? true : false;

// ناخذ inner type
type UnwrapArray<T> = T extends Array<infer U> ? U : T;

// نبني Decompose مناسب
type ResolvePopulate<T> =
  IsArray<FieldType<T>> extends true
    ? DecomposeSchema<UnwrapArray<FieldType<T>>>[]
    : DecomposeSchema<FieldType<T>>;

// ----------------------------------
// 🔥 POPULATE GRAPH
// ----------------------------------

type ExtractPopulateGraph<T> = {
  [K in keyof T as HasSomeMeta<T[K], "oneFrom" | "manyFrom"> extends true
    ? K
    : never]: ResolvePopulate<T[K]>;
};

// ----------------------------------
// ⚙️ AUTOGEN
// ----------------------------------

type AutoGenGroup<T> = {
  onCreate: ExtractFieldsByMeta<T, "autogen" | "now">;
  onUpdate: ExtractFieldsByMeta<T, "updatedAt">;
};

// ----------------------------------
// 🧠 MAIN
// ----------------------------------

type MetaNameMap = {
  idField: "idFields";
  unique: "uniqueFields";
  index: "indexFields";
};

export type DecomposeSchema<T> = {
  [M in keyof MetaNameMap]: ExtractFields<T, M>;
} & {
  populateQraph: ExtractPopulateGraph<T>;
  autogenFields: AutoGenGroup<T>;
};

// ============================================================
// 🧪 EXAMPLE
// ============================================================

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

  createdAt: Date | { now: true };
  updatedAt: Date | { updatedAt: true };

  email: string | { unique: true };

  profile: Profile | { oneFrom: true };
  posts: Post[] | { manyFrom: true };
  skils: string[];
  obj: {a: string, dd}
};

// ----------------------------------
// 🔍 RESULT
// ----------------------------------

type Result = DecomposeSchema<User>["populateQraph"]["profile"];

/*
Result = {
  idFields: {
    id: number;
  };

  uniqueFields: {
    email: string;
  };

  indexFields: {};

  populateQraph: {
    profile: DecomposeSchema<Profile>;
    posts: DecomposeSchema<Post>[];
  };

  autogenFields: {
    onCreate: {
      id: number;
      createdAt: Date;
    };

    onUpdate: {
      updatedAt: Date;
    };
  };
}
*/