import { ExactlyOne, Simplify } from './utils';

import { MappingSchema } from './mapping';

// ============================================================
// 🧠 HELPERS
// ============================================================

type ExtractSchema<T> = T extends MappingSchema<infer S> ? S : never;

type IdOf<T> = MappingSchema<T>['idFields'];
type UniqueOf<T> = MappingSchema<T>['uniqueFields'];

type AutoGenOf<T> = MappingSchema<T>['autogenFields']['onCreate'] &
  MappingSchema<T>['autogenFields']['onUpdate'];

// ============================================================
// 🔗 ENTITY
// ============================================================

type ResolvePopulate<T> =
  T extends MappingSchema<infer S> ? InferItem<S> : never;

export type InferItem<T> = Simplify<
  MappingSchema<T>['base'] &
    MappingSchema<T>['idFields'] &
    MappingSchema<T>['uniqueFields'] &
    MappingSchema<T>['autogenFields']['onCreate'] &
    MappingSchema<T>['autogenFields']['onUpdate'] & {
      [K in keyof MappingSchema<T>['populateQraph']]: MappingSchema<T>['populateQraph'][K] extends Array<
        infer U
      >
        ? ResolvePopulate<U>[]
        : ResolvePopulate<MappingSchema<T>['populateQraph'][K]>;
    }
>;

// ============================================================
// 🔗 unique INPUT
// ============================================================

export type InferUniqueInput<T> = Simplify<ExactlyOne<IdOf<T> & UniqueOf<T>>>;
// ============================================================
// 🔗 POPULATE INPUT
// ============================================================

type PopulateInputNode<T> = Simplify<{
  attach?: RequireAtLeastOne<IdOf<T> & UniqueOf<T>>;
  create?: InferCreateInput<T>;
  attachOrCreate?: Simplify<InferCreateInput<T> & Partial<IdOf<T>>>;
}>;

type PopulateToInput<T> = {
  [K in keyof MappingSchema<T>['populateQraph']]?: MappingSchema<T>['populateQraph'][K] extends Array<
    infer U
  >
    ? PopulateInputNode<ExtractSchema<U>>
    : PopulateInputNode<ExtractSchema<MappingSchema<T>['populateQraph'][K]>>;
};

// ============================================================
// 🧠 CREATE
// ============================================================

export type InferCreateInput<T> = Simplify<
  Omit<
    MappingSchema<T>['base'] &
      MappingSchema<T>['idFields'] &
      MappingSchema<T>['uniqueFields'] &
      MappingSchema<T>['indexFields'] &
      PopulateToInput<T>,
    keyof AutoGenOf<T>
  >
>;

// ============================================================
// 🧠 Update
// ============================================================

type AutoGenUpdateOf<T> = MappingSchema<T>['autogenFields']['onUpdate'];

// ============================================================
// 🔗 POPULATE → UPDATE
// ============================================================

// ----------------------------------
// 🔧 NODE (one)
// ----------------------------------

type UpdateNodeOne<T> = Simplify<{
  // attach existing
  attach?: Partial<IdOf<T>> & Partial<UniqueOf<T>>;

  // update nested
  update?: InferUpdateInput<T>;

  // upsert
  upsert?: {
    where?: Partial<IdOf<T>>;
    update: InferUpdateInput<T>;
    create: InferCreateInput<T>;
  };

  // remove Populate
  detach?: boolean;
}>;

// ----------------------------------
// 🔧 NODE (many)
// ----------------------------------

type UpdateNodeMany<T> = Simplify<{
  attach?: (Partial<IdOf<T>> & Partial<UniqueOf<T>>)[];

  update?: {
    where: InferUniqueInput<T>;
    data: InferUpdateInput<T>;
  }[];

  create?: InferCreateInput<T>[];

  upsert?: {
    where?: Partial<IdOf<T>>;
    update: InferUpdateInput<T>;
    create: InferCreateInput<T>;
  }[];

  delete?: InferUniqueInput<T>[];

  detach?: InferUniqueInput<T>[];
}>;

// ----------------------------------
// 🔗 POPULATE MAP
// ----------------------------------

type PopulateToUpdate<T> = {
  [K in keyof MappingSchema<T>['populateQraph']]?: MappingSchema<T>['populateQraph'][K] extends Array<
    infer U
  >
    ? UpdateNodeMany<ExtractSchema<U>>
    : UpdateNodeOne<ExtractSchema<MappingSchema<T>['populateQraph'][K]>>;
};

// ============================================================
// 🧠 FINAL UPDATE INPUT
// ============================================================

export type InferUpdateInput<T> = Simplify<
  Partial<
    Omit<
      // scalar fields
      MappingSchema<T>['base'] &
        MappingSchema<T>['uniqueFields'] &
        MappingSchema<T>['indexFields'] &
        // Populates
        PopulateToUpdate<T>,
      // ❌ remove updatedAt
      keyof AutoGenUpdateOf<T>
    >
  >
>;

type Post = {
  id: number | { idField: true };
  title: string;
  serail: number | { unique: true };
};

type Profile = {
  id: string | { idField: true; autogen: true };
  bio: string;
  email: string | { unique: true };
};

type User = {
  id: number | { idField: true; autogen: true };
  email: string | { unique: true };
  name: string | { index: true };
  tags: string[];
  obj: { d: string; e: number };
  arrOfObject: { d: string; e: number }[];
  createdAt: Date | { now: true };
  updatedAt: Date | { updatedAt: true };

  profile: Profile | { oneFrom: true };
  posts: Post[] | { manyFrom: true };
};

type UserEntity = InferItem<User>;
type UserCreate = InferCreateInput<User>;
type UserFindUnique = InferUniqueInput<User>;

type UserUpdate = InferUpdateInput<User>;
