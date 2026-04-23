// ============================================================
// 🏗️  LISTEDBASE — Selection System (NEW)
// ============================================================

import { z, ZodObject } from 'zod/v4';
import { MappingSchema } from '../mapping';

// ============================================================
// 🧩 BASE TYPES
// ============================================================

type Output<T extends ZodObject> = z.output<T>;

// ----------------------------------
// unwrap / rewrap
// ----------------------------------

type Unwrap<T> = T extends (infer U)[] ? U : T;

type Rewrap<Original, Result> =
  Original extends any[] ? Result[] : Result;

// ============================================================
// 🔗 POPULATE GRAPH (from Mapping)
// ============================================================

type PopulateGraphOf<T extends ZodObject> =
  MappingSchema<Output<T>>['populateQraph'];

// ============================================================
// 🧠 SELECT INPUT
// ============================================================

export type SelectInput<T extends ZodObject> =
  | {
      pick: readonly (keyof Output<T>)[];
      populate?: PopulateInput<T>;
    }
  | {
      omit: readonly (keyof Output<T>)[];
      populate?: PopulateInput<T>;
    }
  | {
      pluck: keyof Output<T>;
    };

// ----------------------------------
// populate input
// ----------------------------------

type PopulateInput<T extends ZodObject> = {
  [K in keyof PopulateGraphOf<T>]?:
    PopulateGraphOf<T>[K] extends Array<infer U>
      ? SelectInput<any> // resolved later
      : SelectInput<any>;
};

// ============================================================
// 🧠 RESULT ENGINE
// ============================================================

export type ResultOf<
  T extends ZodObject,
  Sel
> =
  // ── pluck
  Sel extends { pluck: infer K }
    ? K extends keyof Output<T>
      ? Output<T>[K]
      : never

  // ── omit
  : Sel extends {
      omit: readonly (infer KO)[];
      populate?: infer PM;
    }
    ? Omit<Output<T>, KO & keyof Output<T>> &
        ResolvePopulate<T, PM>

  // ── pick
  : Sel extends {
      pick: readonly (infer KP)[];
      populate?: infer PM;
    }
    ? Pick<Output<T>, KP & keyof Output<T>> &
        ResolvePopulate<T, PM>

  : never;

// ============================================================
// 🔗 POPULATE RESOLUTION
// ============================================================
type Empty = Record<string, never>;

// ----------------------------------
// populate resolver
// ----------------------------------
type ResolvePopulate<
  T extends ZodObject,
  PM
> = PM extends object
  ? {
      [K in keyof PM & keyof PopulateGraphOf<T>]:
        ResolveRelation<
          PopulateGraphOf<T>[K],
          PM[K]
        >;
    }
  : Empty;

// ----------------------------------
// relation resolver
// ----------------------------------

type ResolveRelation<R, Sel> =
  R extends Array<infer U>
    ? Rewrap<R, ResultOf<any, Sel>>
    : ResultOf<any, Sel>;

// ============================================================
// 🚀 PUBLIC API
// ============================================================
