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
type WhereUnique<T> = MappingSchema<T>['idFields'] &
  MappingSchema<T>['uniqueFields'];

type AttachOrCreateInput<T> = {
  where: WhereUnique<T>;
  create: CreateInput<T>;
};
type AutoGenKeys<T> = keyof (MappingSchema<T>['autogenFields']['onCreate'] &
  MappingSchema<T>['autogenFields']['onUpdate']);

type BaseCreateInput<T> = MappingSchema<T>['base'] &
  MappingSchema<T>['uniqueFields'] &
  MappingSchema<T>['indexFields'];

type AttachInput<T> = MappingSchema<T>['idFields'] &
  MappingSchema<T>['uniqueFields'];
export type CreateInput<T> = Simplify<
  Omit<BaseCreateInput<T> & PopulateToInput<T>, AutoGenKeys<T>>
>;
type PopulateToInput<T> = {
  [K in keyof MappingSchema<T>['populateQraph']]?: MappingSchema<T>['populateQraph'][K] extends Array<
    infer U
  >
    ? {
        attach?: AttachInput<U>[];
        create?: CreateInput<U>[];

        // ✅ FIX
        attachOrCreate?: AttachOrCreateInput<U>[];
      }
    : {
        attach?: AttachInput<MappingSchema<T>['populateQraph'][K]>;
        create?: CreateInput<MappingSchema<T>['populateQraph'][K]>;

        // ✅ FIX
        attachOrCreate?: AttachOrCreateInput<
          MappingSchema<T>['populateQraph'][K]
        >;
      };
};
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

type InferUserProfile = CreateInput<User>;
