import { Simplify, UnwrapArray } from './helpers';
import { MappingSchema } from '../mapping';
import { TSchemaRef } from '../schema';

// ============================================================
// 🧠 ENTITY (READ MODEL)
// ============================================================

type ResolvePopulate<T> =
  T extends MappingSchema<infer S> ? InferItem<S> : never;

export type InferItem<s extends TSchemaRef> = Simplify<
  MappingSchema<S>['base'] &
  MappingSchema<S>['idFields'] &
  MappingSchema<S>['uniqueFields'] &
  MappingSchema<S>['autogenFields']['onCreate'] &
  MappingSchema<S>['autogenFields']['onUpdate'] & {
    [K in keyof MappingSchema<S>['populateQraph']]:
      MappingSchema<S>['populateQraph'][K] extends Array<infer U>
        ? ResolvePopulate<U>[]
        : ResolvePopulate<MappingSchema<S>['populateQraph'][K]>;
  }
>;