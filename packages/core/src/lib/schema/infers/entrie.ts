import { Simplify, UnwrapArray } from './helpers';
import { MappingSchema } from '../mapping';
import { TSchemaRef } from '../schema';

// ============================================================
// 🧠 ENTITY (READ MODEL)
// ============================================================

type ResolvePopulate<T> =
  T extends MappingSchema<infer S> ? InferItem<S> : never;

export type InferItem<T extends TSchemaRef> = Simplify<
  MappingSchema<z>['base'] &
  MappingSchema<z>['idFields'] &
  MappingSchema<z>['uniqueFields'] &
  MappingSchema<z>['autogenFields']['onCreate'] &
  MappingSchema<z>['autogenFields']['onUpdate'] & {
    [K in keyof MappingSchema<z>['populateQraph']]:
      MappingSchema<z>['populateQraph'][K] extends Array<infer U>
        ? ResolvePopulate<U>[]
        : ResolvePopulate<MappingSchema<z>['populateQraph'][K]>;
  }
>;