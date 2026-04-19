import { MappingSchema } from './mapping';

type MergeAutoGen<T> = MappingSchema<T>['autogenFields']['onCreate'] &
  MappingSchema<T>['autogenFields']['onUpdate'];
type ResolvePopulate<T> =
  T extends MappingSchema<infer S> ? InferEntity<S> : never;

type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type InferEntity<T> = Simplify<
  // base
  MappingSchema<T>['base'] &
    // scalar meta
    MappingSchema<T>['idFields'] &
    MappingSchema<T>['uniqueFields'] &
    // 🔥 autogen (FIX)
    MergeAutoGen<T> &
    // Populates
    {
      [K in keyof MappingSchema<T>['populateQraph']]: MappingSchema<T>['populateQraph'][K] extends Array<
        infer U
      >
        ? ResolvePopulate<U>[]
        : ResolvePopulate<MappingSchema<T>['populateQraph'][K]>;
    }
>;

// ============================================================
// 🧩 HELPERS
// ============================================================


type UnwrapArray<T> = T extends Array<infer U> ? U : T;

// ----------------------------------
// 🔍 ACCESSORS FROM MAPPING
// ----------------------------------

type IdOf<T> = MappingSchema<T>['idFields'];
type UniqueOf<T> = MappingSchema<T>['uniqueFields'];

type AutoGenOf<T> =
  & MappingSchema<T>['autogenFields']['onCreate']
  & MappingSchema<T>['autogenFields']['onUpdate'];

// ----------------------------------
// 🧠 EXTRACT SCHEMA FROM MAPPING
// ----------------------------------

type ExtractSchema<T> =
  T extends MappingSchema<infer S> ? S : never;

// ============================================================
// 🔗 POPULATE → INPUT
// ============================================================

type PopulateToInput<T> = {
  [K in keyof MappingSchema<T>['populateQraph']]?: Simplify<
    // resolve target schema
    MappingSchema<T>['populateQraph'][K] extends Array<infer U>
      ? PopulateInputNode<ExtractSchema<U>>
      : PopulateInputNode<
          ExtractSchema<MappingSchema<T>['populateQraph'][K]>
        >
  >;
};

// ----------------------------------
// 🔧 NODE (attach / create / attachOrCreate)
// ----------------------------------

type PopulateInputNode<T> = Simplify<{
  // attach via id + unique
  attach?: Simplify<
    Partial<IdOf<T>> & Partial<UniqueOf<T>>
  >;

  // nested create
  create?: InferCreate<T>;

  // attach or create
  attachOrCreate?: Simplify<
    InferCreate<T> &
    Partial<IdOf<T>>
  >;
}>;

// ============================================================
// 🧠 FINAL InferCreate
// ============================================================

export type InferCreate<T> = Simplify<
  Omit<
    // base + scalar metas + populate
    & MappingSchema<T>['base']
    & MappingSchema<T>['uniqueFields']
    & MappingSchema<T>['indexFields']
    & PopulateToInput<T>,

    // ❌ remove autogen fields
    keyof AutoGenOf<T>
  >
>;
// ============================================================
// 🧪 EXAMPLES
// ============================================================

type Post = {
  id: number | { idField: true }; // manual id → مطلوب في create
  title: string;
};

interface Profile {
  id: string | { idField: true }; // manual id → مطلوب في create
  bio: string;
  g: string
}

type User = {
  id: number | { idField: true; autogen: true }; // autogen → مستبعد من create
  name: string;
  tags: string[];
  obj: { a: number; b: string };
  createdAt: Date | { now: true };
  updatedAt: Date | { updatedAt: true };
  email: string | { unique: true };
  profile: Profile | { oneFrom: true };
  posts: Post[] | { manyFrom: true };
};

type InferUserProfile = InferCreate<User>["profile"]
