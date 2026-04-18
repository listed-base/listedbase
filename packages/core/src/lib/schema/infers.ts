// ============================================================
// 🔮 INFER — Input Types (CreateInput, UpdateInput)
// Built on top of DecomposeSchema
// ============================================================

import type { DecomposeSchema, TMeta } from './typing';

// ----------------------------------
// 🧹 UTILS
// ----------------------------------

type ExcludeUnionMark<T> = Exclude<T, TMeta>;

type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type Builtin   = Primitive | Date  | RegExp | Map<any, any> | Set<any>;

type DeepClean<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
    ? DeepClean<U>[]
    : T extends object
      ? { [K in keyof T]: DeepClean<T[K]> }
      : T;

type MetaOf<T>       = Extract<T, TMeta>;
type HasMeta<T, M extends keyof TMeta> = [MetaOf<T>] extends [never]
  ? false
  : MetaOf<T> extends { [K in M]: any }
    ? true
    : false;

// ----------------------------------
// 🔑 MANUAL ID FIELDS (idField بدون autogen)
// ----------------------------------

type ExtractManualIdFields<T> = DeepClean<{
  [K in keyof T as HasMeta<T[K], 'idField'> extends true
    ? HasMeta<T[K], 'autogen'> extends true
      ? never   // autogen → server-generated → استبعد
      : K        // manual id → مطلوب
    : never]: ExcludeUnionMark<T[K]>;
}>;

// ----------------------------------
// 📎 ID REF — للـ attach (idFields + uniqueFields)
// ----------------------------------

type IdRef<S extends DecomposeSchema<any>> =
  S['idFields'] & Partial<S['uniqueFields']>;

// ----------------------------------
// 🌐 POPULATION GRAPH → CREATE INPUT
// ----------------------------------

type IsPopulationArray<T> = T extends any[] ? true : false;
type UnwrapPopulation<T>  = T extends (infer U)[] ? U : T;

type PopulationGraphToCreateInput<G> = {
  [K in keyof G]?: IsPopulationArray<G[K]> extends true
    ? {
        attach?: IdRef<DecomposeSchema<UnwrapPopulation<G[K]>>>[];
        create?: CreateInput<UnwrapPopulation<G[K]>>[];
      }
    : {
        attach?: IdRef<DecomposeSchema<G[K]>>;
        create?: CreateInput<G[K]>;
      }
};

// ----------------------------------
// 🌐 POPULATION GRAPH → UPDATE INPUT
// ----------------------------------

type PopulationGraphToUpdateInput<G> = {
  [K in keyof G]?: IsPopulationArray<G[K]> extends true
    ? {
        attach?: IdRef<DecomposeSchema<UnwrapPopulation<G[K]>>>[];
        detach?: IdRef<DecomposeSchema<UnwrapPopulation<G[K]>>>[];
        create?: CreateInput<UnwrapPopulation<G[K]>>[];
      }
    : {
        attach?: IdRef<DecomposeSchema<G[K]>>;
        detach?: IdRef<DecomposeSchema<G[K]>>;
        create?: CreateInput<G[K]>;
      }
};

// ----------------------------------
// ✏️ CREATE INPUT
// ----------------------------------

interface CreateInputI<T> {
  value: DecomposeSchema<T> extends infer S extends DecomposeSchema<any>
    ? ExtractManualIdFields<T>                     // id يدوي (مطلوب)
      & S['base']                                   // الحقول العادية
      & S['uniqueFields']                           // unique fields
      & PopulationGraphToCreateInput<S['populateQraph']> // populations
    : never;
}

export type CreateInput<T> = CreateInputI<T>['value'];

// ----------------------------------
// 🔄 UPDATE INPUT
// ----------------------------------

interface UpdateInputI<T> {
  value: DecomposeSchema<T> extends infer S extends DecomposeSchema<any>
    ? S['idFields']                                  // id مطلوب للتعريف
      & Partial<                                     // كل شيء آخر اختياري
          ExtractManualIdFields<T>
          & S['base']
          & S['uniqueFields']
        >
      & PopulationGraphToUpdateInput<S['populateQraph']> // populations + detach
    : never;
}

export type UpdateInput<T> = UpdateInputI<T>['value'];

// ============================================================
// 🧪 EXAMPLES
// ============================================================

type Post = {
  id: number | { idField: true };        // manual id → مطلوب في create
  title: string;
};

interface Profile {
  id: string | { idField: true };        // manual id → مطلوب في create
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

// ----------------------------------
// ✏️ CreateInput<Post>
// ----------------------------------
// {
//   id:    number          ← manual idField (مطلوب)
//   title: string
// }
type PostCreate = CreateInput<Post>;

// ----------------------------------
// ✏️ CreateInput<User>
// ----------------------------------
// {
//   name:      string
//   tags:      string[]
//   obj:       { a: number; b: string }
//   email:     string                    ← unique (مطلوب)
//   posts?:    { attach?: { id: number }[]; create?: CreateInput<Post>[] }
//   profile?:  { attach?: { id: string };  create?: CreateInput<Profile> }
//   — id مستبعد (autogen)
//   — createdAt / updatedAt مستبعدان (server-generated)
// }
type UserCreate = CreateInput<User>;

// ----------------------------------
// 🔄 UpdateInput<User>
// ----------------------------------
// {
//   id:        number                    ← idField (مطلوب للتعريف)
//   name?:     string
//   tags?:     string[]
//   obj?:      { a: number; b: string }
//   email?:    string
//   posts?:    { attach?: ...; detach?: ...; create?: ... }
//   profile?:  { attach?: ...; detach?: ...; create?: ... }
// }
type UserUpdate = UpdateInput<User>;

// ----------------------------------
// 🔍 Usage examples (runtime shape)
// ----------------------------------

const newUser: UserCreate = {
  name:  'Fathi',
  tags:  ['dev', 'ts'],
  obj:   { a: 1, b: 'x' },
  email: 'fathi@example.com',
  posts: {
    attach: [{ id: 1 }, { id: 2 }],         // ربط بمنشورات موجودة
    create: [{ id: 10, title: 'Hello' }],   // إنشاء منشور جديد
  },
  profile: {
    create: { id: 'p1', bio: 'engineer' },  // إنشاء profile جديد
  },
};

const updateUser: UserUpdate = {
  id:    42,                                 // مطلوب للتعريف
  name:  'Fathi Updated',
  posts: {
    attach: [{ id: 3 }],                    // إضافة منشور موجود
    detach: [{ id: 1 }],                    // فصل منشور
    create: [{ id: 11, title: 'New' }],     // إنشاء ومباشر
  },
};