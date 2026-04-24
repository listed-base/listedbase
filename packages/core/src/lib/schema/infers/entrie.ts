import { Simplify, UnwrapArray } from './helpers';
import { MappingSchema } from '../mapping';
import { TSchemaRef } from '../schema';
import { z } from 'zod/v4';

// ============================================================
// 🧠 ENTITY (READ MODEL)
// ============================================================

type ResolvePopulate<T> =
  T extends MappingSchema<infer S> ? InferItem<S> : never;

export type InferItem<S extends TSchemaRef> = Simplify<
  MappingSchema<z.output<S["schema"]>>['base'] &
    MappingSchema<S>['idFields'] &
    MappingSchema<S>['uniqueFields'] &
    MappingSchema<S>['autogenFields']['onCreate'] &
    MappingSchema<S>['autogenFields']['onUpdate'] & {
      [K in keyof MappingSchema<S>['populateQraph']]: MappingSchema<S>['populateQraph'][K] extends Array<
        infer U
      >
        ? ResolvePopulate<U>[]
        : ResolvePopulate<MappingSchema<S>['populateQraph'][K]>;
    }
>;
