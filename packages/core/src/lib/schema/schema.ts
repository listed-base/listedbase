import { z, ZodObject } from 'zod/v4';
import core from 'zod/v4/core';

// ============================================================
// 🔧 LAZY RESOLVER
// ============================================================

export type ResolveLazy<T> = T extends () => infer R ? ResolveLazy<R> : T;
export type ResolveFields<T> = { [K in keyof T]: ResolveLazy<T[K]> };

// ============================================================
// 🏗️ SCHEMA OPTIONS
// ============================================================

interface TSchemaOptions<
  TName extends string,
  TFields extends core.$ZodLooseShape,
> {
  name: TName;
  fields: TFields;
}

// ============================================================
// 🔥 lSCHEMA
// ============================================================

export function lSchema<
  TName extends string,
  TFields extends Record<string, any>,
>({
  name,
  fields,
}: TSchemaOptions<TName, TFields>): ZodObject<
  ResolveFields<TFields>,
  core.$strict
> {
  const resolvedShape: any = {};
  let hasIdField = false;
  for (const key in fields) {
    const value = fields[key];

    if (typeof value === 'function') {
      resolvedShape[key] = z.lazy(() => value());
    } else {
      resolvedShape[key] = value;
    }

    const field = resolvedShape[key];
    if (field?.__lMeta?.idField === true) {
      hasIdField = true;
    }
    resolvedShape[key] = resolvedShape[key].meta(resolvedShape[key].__lMeta);
  }

  if (!hasIdField) {
    throw new Error(`listedbase: Schema "${name}" must have an id field`);
  }

  const schema = z.object(resolvedShape).meta({ id: name }) as any;
  z.globalRegistry.add(schema, { id: name });
  return schema;
}
