import { Simplify, UnwrapArray } from './helpers';
import { MappingSchema } from '../mapping';
import { TSchemaRef } from '../schema';
import { z } from 'zod/v4';

// ============================================================
// 🧠 ENTITY (READ MODEL)
// ============================================================

type ResolvePopulate<T> =
  T extends MappingSchema<infer S> ? InferItem<z.output<S["schema"]>> : never;

export type InferItem<S extends TSchemaRef> = Simplify<
  MappingSchema<z.output<S["schema"]>>['base'] &
    MappingSchema<z.output<S["schema"]>>['idFields'] &
    MappingSchema<z.output<S["schema"]>>['uniqueFields'] &
    MappingSchema<z.output<S["schema"]>>['autogenFields']['onCreate'] &
    MappingSchema<z.output<S["schema"]>>['autogenFields']['onUpdate'] & {
      [K in keyof MappingSchema<z.output<S["schema"]>>['populateQraph']]: MappingSchema<z.output<S["schema"]>>['populateQraph'][K] extends Array<
        infer U
      >
        ? ResolvePopulate<U>[]
        : ResolvePopulate<MappingSchema<z.output<S["schema"]>>['populateQraph'][K]>;
    }
>;
