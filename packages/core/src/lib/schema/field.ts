// field.ts
import * as z from 'zod/v4';
import { brandMeta, Branded, TMetaFlags } from './meta';
import { EmptyObject } from '../utils';

// ============================================================
// 🔗 CHAINABLE INDEX METHODS
// ============================================================

type IndexType = z.ZodString | z.ZodNumber | z.ZodDate | z.ZodBigInt;

export type WithIndexMethods<
  T extends IndexType,
  TMeta extends TMetaFlags = EmptyObject,
> = Branded<T, TMeta> & {
  unique(): WithIndexMethods<T, TMeta & { unique: true }>;
  index(): WithIndexMethods<T, TMeta & { index: true }>;
};

function withIndexMethods<
  T extends IndexType,
  TMeta extends TMetaFlags = EmptyObject,
>(schema: T, meta: TMeta = {} as TMeta): WithIndexMethods<T, TMeta> {
  const branded = Object.assign(schema, { __lMeta: meta });
  return Object.assign(branded, {
    unique() {
      return withIndexMethods(schema, { ...meta, unique: true as const });
    },
    index() {
      return withIndexMethods(schema, { ...meta, index: true as const });
    },
  }) as WithIndexMethods<T, TMeta>;
}

// ============================================================
// 🏗️ LFIELD
// ============================================================

class LField {
  id = this.createIdField();

  private createIdField() {
    const id = <T extends IndexType>(schema: T) =>
      brandMeta(schema, { idField: true as const });

    id.autouuid = () =>
      brandMeta(
        z.uuid().default(() => crypto.randomUUID()),
        {
          autogen: true as const,
          idField: true as const,
          unique: true as const,
          index: true as const,
        },
      );

    id.autoincrement = () =>
      brandMeta(z.number(), {
        autogen: true as const,
        idField: true as const,
        autoIncrement: true as const,
        unique: true as const,
        index: true as const,
      });

    return id;
  }

  autouuid = () =>
    brandMeta(
      z.uuid().default(() => crypto.randomUUID()),
      { autogen: true as const },
    );
  autoincrement = () =>
    brandMeta(z.number(), {
      autogen: true as const,
      autoIncrement: true as const,
    });
  now = () =>
    brandMeta(
      z.iso.datetime().default(() => new Date().toISOString()),
      { autogen: true as const, now: true as const },
    );
  updatedAt = () =>
    brandMeta(
      z.iso
        .datetime()
        .nullable()
        .default(() => null),
      { autogen: true as const, updatedAt: true as const },
    );

  oneFrom = <S extends z.ZodObject>(schema: S) =>
    brandMeta(schema, { oneFrom: true as const });

  manyFrom = <S extends z.ZodObject>(schema: S) =>
    brandMeta(z.array(schema), { manyFrom: true as const });
}

// ============================================================
// 🔥 EXPORT
// ============================================================

const { string, number, date, bigint, ...rest } = z;

export const lField = Object.assign(
  {
    string: (): WithIndexMethods<z.ZodString, EmptyObject> =>
      withIndexMethods(z.string()),
    number: (): WithIndexMethods<z.ZodNumber, EmptyObject> =>
      withIndexMethods(z.number()),
    date: (): WithIndexMethods<z.ZodDate, EmptyObject> =>
      withIndexMethods(z.date()),
    bigint: (): WithIndexMethods<z.ZodBigInt, EmptyObject> =>
      withIndexMethods(z.bigint()),
  },
  rest,
  new LField(),
) as Omit<typeof z, 'string' | 'number' | 'date' | 'bigint'> & {
  string: () => WithIndexMethods<z.ZodString, EmptyObject>;
  number: () => WithIndexMethods<z.ZodNumber, EmptyObject>;
  date: () => WithIndexMethods<z.ZodDate, EmptyObject>;
  bigint: () => WithIndexMethods<z.ZodBigInt, EmptyObject>;
} & LField;
