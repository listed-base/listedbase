// ============================================================
// 🏗️  TYPE-LEVEL ORM SCHEMA ENGINE
// ============================================================

// ----------------------------------
// 🧩 META DEFINITION
// ----------------------------------

export type TMeta = {
  idField?: true;
  unique?: true;
  index?: true;

  oneFrom?: any;   // schema ref
  manyFrom?: any;  // schema ref

  autogen?: true;

  now?: true;        // onCreate
  updatedAt?: true;  // onUpdate
};

// ----------------------------------
// 🔗 RELATION HELPERS
// ----------------------------------

export type OneFrom<S> = { oneFrom: S };
export type ManyFrom<S> = { manyFrom: S };

// ----------------------------------
// 🧹 CLEAN TYPES (remove meta from unions)
// ----------------------------------

type ExcludeUnionMark<T> = Exclude<T, TMeta>;

type ExcludeUnionMarks<T> =
  T extends Array<infer U>
    ? ExcludeUnionMarks<U>[]
    : T extends object
      ? { [K in keyof T]: ExcludeUnionMarks<ExcludeUnionMark<T[K]>> }
      : ExcludeUnionMark<T>;

// ----------------------------------
// 🔍 META DETECTION
// ----------------------------------

type MetaOf<T> = Extract<T, TMeta>;

type HasMeta<T, M extends keyof TMeta> =
  MetaOf<T> extends { [K in M]: any } ? true : false;

// multiple metas (union)
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
// 🔗 RELATION RESOLUTION
// ----------------------------------

type RelationSchema<T, K extends "oneFrom" | "manyFrom"> =
  Extract<T, { [P in K]: any }> extends infer R
    ? R extends { [P in K]: infer S }
      ? S
      : never
    : never;

type ResolveRelation<T, K extends "oneFrom" | "manyFrom"> =
  DecomposeSchema<RelationSchema<T, K>>;

type ExtractRelations<T, K extends "oneFrom" | "manyFrom"> = {
  [P in keyof T as HasMeta<T[P], K> extends true ? P : never]:
    K extends "manyFrom"
      ? ResolveRelation<T[P], K>[]
      : ResolveRelation<T[P], K>;
};

// ----------------------------------
// ⚙️ AUTOGEN (LIFECYCLE)
// ----------------------------------

type AutoGenGroup<T> = {
  onCreate: ExtractFieldsByMeta<T, "autogen" | "now">;
  onUpdate: ExtractFieldsByMeta<T, "updatedAt">;
};

// ----------------------------------
// 🧠 MAIN DECOMPOSE
// ----------------------------------

type MetaNameMap = {
  idField: "idFields";
  unique: "uniqueFields";
  index: "indexFields";
};

export type DecomposeSchema<T> = {
  // static meta
  [M in keyof MetaNameMap]: ExtractFields<T, M>;
} & {
  // relations (typed graph 🔥)
  oneFrom: ExtractRelations<T, "oneFrom">;
  manyFrom: ExtractRelations<T, "manyFrom">;

  // lifecycle
  autogenFields: AutoGenGroup<T>;
};

// ----------------------------------
// 🧪 EXAMPLE
// ----------------------------------

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

  profile: Profile  | { oneFrom: true };
  posts: Post[] | { manyFrom: true };
};

// ----------------------------------
// 🔍 RESULT
// ----------------------------------

type Result = DecomposeSchema<User>["oneFrom"];



/*
Result = {
  idFields: {
    id: number;
  };

  uniqueFields: {
    email: string;
  };

  indexFields: {};

  populateQraph : {
    posts: 
  }

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