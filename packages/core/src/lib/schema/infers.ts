import {
  Simplify,
  UnwrapArray,
} from './utils';

import {
  MappingSchema,
} from './mapping';

// ============================================================
// 🧠 HELPERS
// ============================================================

type ExtractSchema<T> =
  T extends MappingSchema<infer S> ? S : never;

type IdOf<T> = MappingSchema<T>['idFields'];
type UniqueOf<T> = MappingSchema<T>['uniqueFields'];

type AutoGenOf<T> =
  & MappingSchema<T>['autogenFields']['onCreate']
  & MappingSchema<T>['autogenFields']['onUpdate'];

// ============================================================
// 🔗 ENTITY
// ============================================================

type ResolveRelation<T> =
  T extends MappingSchema<infer S>
    ? InferEntity<S>
    : never;

export type InferEntity<T> = Simplify<
  & MappingSchema<T>['base']
  & MappingSchema<T>['idFields']
  & MappingSchema<T>['uniqueFields']
  & MappingSchema<T>['autogenFields']['onCreate']
  & MappingSchema<T>['autogenFields']['onUpdate']
  & {
    [K in keyof MappingSchema<T>['populateQraph']]:
      MappingSchema<T>['populateQraph'][K] extends Array<infer U>
        ? ResolveRelation<U>[]
        : ResolveRelation<MappingSchema<T>['populateQraph'][K]>
  }
>;

// ============================================================
// 🔗 POPULATE INPUT
// ============================================================

type PopulateInputNode<T> = Simplify<{
  attach?: Partial<IdOf<T>> & Partial<UniqueOf<T>>;
  create?: InferCreate<T>;
  attachOrCreate?: Simplify<
    InferCreate<T> & Partial<IdOf<T>>
  >;
}>;

type PopulateToInput<T> = {
  [K in keyof MappingSchema<T>['populateQraph']]?:
    MappingSchema<T>['populateQraph'][K] extends Array<infer U>
      ? PopulateInputNode<ExtractSchema<U>>
      : PopulateInputNode<
          ExtractSchema<MappingSchema<T>['populateQraph'][K]>
        >;
};

// ============================================================
// 🧠 CREATE
// ============================================================

export type InferCreate<T> = Simplify<
  Omit<
    & MappingSchema<T>['base']
    & MappingSchema<T>['uniqueFields']
    & MappingSchema<T>['indexFields']
    & PopulateToInput<T>,
    keyof AutoGenOf<T>
  >
>;

type Post = {
  id: number | { idField: true };
  title: string;
};

type Profile = {
  id: string ;
  bio: string;
  user: User | { oneFrom: true };
};

type User = {
  id: number | { idField: true; autogen: true };

  name: string;
  tags: string[];

  createdAt: Date | { now: true };
  updatedAt: Date | { updatedAt: true };

  email: string | { unique: true };

  profile: Profile | { oneFrom: true };
  posts: Post[] | { manyFrom: true };
};


type UserEntity = InferEntity<User>;
type UserCreate = InferCreate<User>["Pro"]
