import { Simplify, UnwrapArray } from './helpers';
import { MappingSchema } from '../mapping';
import { TSchemaRef } from '../schema';
import { z } from 'zod/v4';

// ============================================================
// 🧠 ENTITY (READ MODEL)
// ============================================================

type ResolvePopulate<T> =
  T extends MappingSchema<infer S> ? InferEntrie<S> : never;

export type InferEntrie<T> = Simplify<
  MappingSchema<T>['base'] &
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

type InferItem<S extends TSchemaRef> = InferEntrie<z.output<S['schema']>>

