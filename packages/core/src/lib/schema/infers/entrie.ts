import { Simplify, UnwrapArray } from './helpers';
import { MappingSchema } from '../mapping';
import { TSchemaRef } from '../schema';
import { z } from 'zod/v4';

// ============================================================
// 🧠 ENTITY (READ MODEL)
// ============================================================

type ResolvePopulate<> =
  T extends MappingSchema<infer S> ? InferItem<S> : never;

export type InferItem<T extends TSchemaRef> = Simplify<
  MappingSchema<z.output<T["schema"]>>['base'] &
  MappingSchema<z.output<T["schema"]>>['idFields'] &
  MappingSchema<z.output<T["schema"]>>['uniqueFields'] &
  MappingSchema<z.output<T["schema"]>>['autogenFields']['onCreate'] &
  MappingSchema<z.output<T["schema"]>>['autogenFields']['onUpdate'] & {
    [K in keyof MappingSchema<z.output<T["schema"]>>['populateQraph']]:
      MappingSchema<z.output<T["schema"]>>['populateQraph'][K] extends Array<infer U>
        ? ResolvePopulate<U>[]
        : ResolvePopulate<MappingSchema<z.output<T["schema"]>>['populateQraph'][K]>;
  }
>;