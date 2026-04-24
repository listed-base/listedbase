import { Simplify, UnwrapArray } from './helpers';
import { MappingSchema } from '../mapping';
import { TSchemaRef } from '../schema';

// ============================================================
// 🧠 ENTITY (READ MODEL)
// ============================================================

type ResolvePopulate<T> =
  T extends MappingSchema<infer S> ? InferItem<S> : never;

export type InferItem<T extends TSchemaRef> = Simplify<
  MappingSchema<>['base'] &
  MappingSchema<T>['idFields'] &
  MappingSchema<T>['uniqueFields'] &
  MappingSchema<T>['autogenFields']['onCreate'] &
  MappingSchema<T>['autogenFields']['onUpdate'] & {
    [K in keyof MappingSchema<T>['populateQraph']]:
      MappingSchema<T>['populateQraph'][K] extends Array<infer U>
        ? ResolvePopulate<U>[]
        : ResolvePopulate<MappingSchema<T>['populateQraph'][K]>;
  }
>;