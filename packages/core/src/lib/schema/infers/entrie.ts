import { Simplify, UnwrapArray } from './helpers';
import { MappingSchema } from '../mapping';
import { TSchemaRef } from '../schema';
import { z } from 'zod/v4';

// ============================================================
// 🧠 ENTITY (READ MODEL)
// ============================================================

type ResolvePopulate<T> =
  T extends MappingSchema<infer S> ? InferItemz.output<S["schema"]>> : never;

export type InferItem<S extends TSchemaRef> = Simplify<
  MappingSchema<z.output<S["schema"]>>['base'] &
    MappingSchemaz.output<S["schema"]>>['idFields'] &
    MappingSchemaz.output<S["schema"]>>['uniqueFields'] &
    MappingSchemaz.output<S["schema"]>>['autogenFields']['onCreate'] &
    MappingSchemaz.output<S["schema"]>>['autogenFields']['onUpdate'] & {
      [K in keyof MappingSchemaz.output<S["schema"]>>['populateQraph']]: MappingSchemaz.output<S["schema"]>>['populateQraph'][K] extends Array<
        infer U
      >
        ? ResolvePopulate<U>[]
        : ResolvePopulate<MappingSchemaz.output<S["schema"]>>['populateQraph'][K]>;
    }
>;
