import { MappingSchema } from './mapping';
type ResolveRelation<T> =
  T extends MappingSchema<infer S> ? InferEntity<S> : never;

export type InferEntity<T> =
  // 🔥 كل الحقول scalar
  MappingSchema<T>['base'] &
    MappingSchema<T>['idFields'] &
    MappingSchema<T>['uniqueFields'] &
    MappingSchema<T>['indexFields'] &
    MappingSchema<T>['indexFields'] &
    // 🔗 relations
    {
      [K in keyof MappingSchema<T>['populateQraph']]: MappingSchema<T>['populateQraph'][K] extends Array<
        infer U
      >
        ? ResolveRelation<U>[]
        : ResolveRelation<MappingSchema<T>['populateQraph'][K]>;
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

type InferUserProfile = InferEntity<User>
