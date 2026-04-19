import { Simplify, UnwrapArray } from './utils';

import { MappingSchema } from './mapping';

// ============================================================
// 🧠 HELPERS
// ============================================================

type ExtractSchema<T> = T extends MappingSchema<infer S> ? S : never;

type IdOf<T> = MappingSchema<T>['idFields'];
type UniqueOf<T> = MappingSchema<T>['uniqueFields'];
type IndexOf<T> = MappingSchema<T>['indexFields'];

type AutoGenOf<T> = MappingSchema<T>['autogenFields']['onCreate'] &
  MappingSchema<T>['autogenFields']['onUpdate'];

// ============================================================
// 🔗 ENTITY
// ============================================================

type ResolveRelation<T> =
  T extends MappingSchema<infer S> ? InferEntity<S> : never;

export type InferEntity<T> = Simplify<
  MappingSchema<T>['base'] &
    MappingSchema<T>['idFields'] &
    MappingSchema<T>['uniqueFields'] &
    MappingSchema<T>['autogenFields']['onCreate'] &
    MappingSchema<T>['autogenFields']['onUpdate'] & {
      [K in keyof MappingSchema<T>['populateQraph']]: MappingSchema<T>['populateQraph'][K] extends Array<
        infer U
      >
        ? ResolveRelation<U>[]
        : ResolveRelation<MappingSchema<T>['populateQraph'][K]>;
    }
>;

// ============================================================
// 🔗 POPULATE INPUT
// ============================================================

type PopulateInputNode<T> = Simplify<{
  attach?: Partial<IdOf<T>> & Partial<UniqueOf<T>>;
  create?: InferCreate<T>;
  attachOrCreate?: Simplify<InferCreate<T> & Partial<IdOf<T>>>;
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

export type InferCreate<T> = Simplify<
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
// 🔗 RELATION FILTERS
// ============================================================

// one-to-one (profile)
type OneRelationFilter<T> = Simplify<
  InferFindUnique<T>
>;

// one-to-many (posts)
type ManyRelationFilter<T> = Simplify<{
  some?: InferFindIndex<T>;
  none?: InferFindIndex<T>;
  every?: InferFindIndex<T>;
}>;

// ----------------------------------
// 🔗 POPULATE → FILTER
// ----------------------------------

type PopulateToFilter<T, Mode extends 'unique' | 'index'> = {
  [K in keyof MappingSchema<T>['populateQraph']]?:
    MappingSchema<T>['populateQraph'][K] extends Array<infer U>
      ? ManyRelationFilter<ExtractSchema<U>>
      : OneRelationFilter<
          ExtractSchema<
            MappingSchema<T>['populateQraph'][K]
          >
        >;
};

// ============================================================
// 🧠 UNIQUE (exact lookup)
// ============================================================

export type InferFindUnique<T> = Simplify<
  // 🔥 scalar unique
  & Partial<IdOf<T>>
  & Partial<UniqueOf<T>>

  // 🔗 relations
  & PopulateToFilter<T, 'unique'>
>;

// ============================================================
// 🧠 INDEX (search / multi)
// ============================================================

export type InferFindIndex<T> = Simplify<
  // 🔥 unique + index
  & InferFindUnique<T>
  & Partial<IndexOf<T>>
>;
type Post = {
  id: number | { idField: true };
  title: string;
};

type Profile = {
  id: string | { idField: true; autogen: true };
  bio: string;
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

 

type UserEntity = InferEntity<User>;
type UserCreate = InferCreate<User>;
type UserFindUnique = InferFindUnique<User>;
type UserFindIndex = InferFindIndex<User>;
