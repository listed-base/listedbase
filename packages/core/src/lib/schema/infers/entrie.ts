import { Simplify, UnwrapArray } from './helpers';
import { MappingSchema } from '../mapping';
import { TSchemaRef } from '../schema';
import { z } from 'zod/v4';

// ============================================================
// 🧠 ENTITY (READ MODEL)
// ============================================================

type ResolvePopulate<T> =
  T extends MappingSchema<infer S> ? InferItem<S> : never;

export type InferItem<T extends TSchemaRef> = Simplify<
  MappingSchema<z.output<T>>['base'] &
  MappingSchema<z.output<T>>['idFields'] &
  MappingSchema<z.output<T>>['uniqueFields'] &
  MappingSchema<z.output<T>>['autogenFields']['onCreate'] &
  MappingSchema<z.output<T>>['autogenFields']['onUpdate'] & {
    [K in keyof MappingSchema<z.output<T>>['populateQraph']]:
      MappingSchema<z.output<T>>['populateQraph'][K] extends Array<infer U>
        ? ResolvePopulate<U>[]
        : ResolvePopulate<MappingSchema<z.output<T>>['populateQraph'][K]>;
  }
>;