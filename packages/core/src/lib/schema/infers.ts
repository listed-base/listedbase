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
type Builtin = Primitive | Date  | RegExp | Map<any, any> | Set<any>;

type DeepClean<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
    ? DeepClean<U>[]
    : T extends object
      ? { [K in keyof T]: DeepClean<T[K]> }
      : T;

type MetaOf<T> = Extract<T, TMeta>;
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
      ? never // autogen → server-generated → استبعد
      : K // manual id → مطلوب
    : never]: ExcludeUnionMark<T[K]>;
}>;

// ----------------------------------
// 📎 ID REF — للـ attach (idFields + uniqueFields)
// ----------------------------------

type IdRef<S extends DecomposeSchema<any>> = S['idFields'] &
  Partial<S['uniqueFields']>;

// ----------------------------------
// 🌐 POPULATION GRAPH → CREATE INPUT
// ----------------------------------

type IsPopulationArray<T> = T extends any[] ? true : false;
type UnwrapPopulation<T> = T extends (infer U)[] ? U : T;

type PopulationGraphToCreateInput<G> = {
  [K in keyof G]?: IsPopulationArray<G[K]> extends true
    ? {
        attach?: IdRef<DecomposeSchema<UnwrapPopulation<G[K]>>>[];
        create?: CreateInput<UnwrapPopulation<G[K]>>[];
      }
    : {
        attach?: IdRef<DecomposeSchema<G[K]>>;
        create?: CreateInput<G[K]>;
      };
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
      };
};

// ----------------------------------
// ✏️ CREATE INPUT
// ----------------------------------

interface CreateInputI<T> {
  value: DecomposeSchema<T> extends infer S extends DecomposeSchema<any>
    ? ExtractManualIdFields<T> & // id يدوي (مطلوب)
        S['base'] & // الحقول العادية
        S['uniqueFields'] & // unique fields
        PopulationGraphToCreateInput<S['populateQraph']> // populations
    : never;
}

export type CreateInput<T> = CreateInputI<T>['value'];

// ----------------------------------
// 🔄 UPDATE INPUT
// ----------------------------------

interface UpdateInputI<T> {
  value: DecomposeSchema<T> extends infer S extends DecomposeSchema<any>
    ? S['idFields'] & // id مطلوب للتعريف
        Partial<
          // كل شيء آخر اختياري
          ExtractManualIdFields<T> & S['base'] & S['uniqueFields']
        > &
        PopulationGraphToUpdateInput<S['populateQraph']> // populations + detach
    : never;
}

export type UpdateInput<T> = UpdateInputI<T>['value'];



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

type typing = DecomposeSchema<User>;

type create = CreateInput<User>["profile"]
type update = UpdateInput<User>;

const xxxxx = {} as create;

xxxx.attach


