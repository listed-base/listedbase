import { Simplify, ExactlyOne, RequireAtLeastOne } from './helpers';
import { MappingSchema } from '../mapping';
import { InferItem } from './entries';
import { InferWhereInput } from './filter';

// ============================================================
// 🧠 CORE ACCESSORS
// ============================================================

type IdOf<T> = MappingSchema<T>['idFields'];
type UniqueOf<T> = MappingSchema<T>['uniqueFields'];
type IndexOf<T> = MappingSchema<T>['indexFields'];

type AutoGenCreate<T> =
  MappingSchema<T>['autogenFields']['onCreate'];

type AutoGenUpdate<T> =
  MappingSchema<T>['autogenFields']['onUpdate'];

// ============================================================
// 🔥 UNIQUE INPUT
// ============================================================

export type InferUniqueInput<T> = Simplify<
  ExactlyOne<IdOf<T> & UniqueOf<T>>
>;

// ============================================================
// 🧠 CREATE INPUT
// ============================================================

type PopulateToInput<T> = {
  [K in keyof MappingSchema<T>['populateQraph']]?: any;
};

export type InferCreateInput<T> = Simplify<
  Omit<
    MappingSchema<T>['base'] &
    IdOf<T> &
    UniqueOf<T> &
    IndexOf<T> &
    PopulateToInput<T>,
    keyof AutoGenCreate<T>
  >
>;

// ============================================================
// 🧠 UPDATE INPUT
// ============================================================

export type InferUpdateInput<T> = Simplify<
  Partial<
    Omit<
      MappingSchema<T>['base'] &
      UniqueOf<T> &
      IndexOf<T> &
      PopulateToInput<T>,
      keyof AutoGenUpdate<T>
    >
  >
>;

// ============================================================
// 🚀 UPSERT INPUT
// ============================================================

export type InferUpsertInput<T> = Simplify<
  InferUniqueInput<T> &
  InferCreateInput<T> &
  InferUpdateInput<T>
>;