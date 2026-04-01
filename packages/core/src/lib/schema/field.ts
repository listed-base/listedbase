/**
 * Zod extensions
 *
 * This file extends the Zod library with additional methods.
 *
 * - `unique()` method to add unique constraints to Zod types
 * - `isUnique()` function to check if a Zod type has a unique constraint
 *
 */
import * as z from 'zod/v4';
import { addMeta } from ".";
import { TSchemaRef } from './schema.ts';

type IndexType = z.ZodString | z.ZodNumber | z.ZodDate | z.ZodBigInt;

interface TFieldIndex extends z.ZodType {
    unique(): z.ZodUnion<[this, z.ZodObject<{ unique: z.ZodLiteral<true> }>]>;
    index(): z.ZodUnion<[this, z.ZodObject<{ index: z.ZodLiteral<true> }>]>;
}

declare module "zod/v4" {
    interface ZodString extends TFieldIndex { }
    interface ZodNumber extends TFieldIndex { }
    interface ZodDate extends TFieldIndex { }
    interface ZodBigInt extends TFieldIndex { }
}

class FieldIndex {
    unique<T extends IndexType>(this: T) {
        return addMeta(this, { unique: true })
    };
    index<T extends IndexType>(this: T) {
        return addMeta(this, { index: true })
    }
}



class LField {
    id = this.createIdField()
    private createIdField() {
        const id = <T extends IndexType>(schema: T) => {
            return addMeta(schema, { idField: true }) as z.ZodUnion<[T, z.ZodObject<{ idField: z.ZodLiteral<true> }>]>;
        };
        id.autouuid = () => addMeta(z.uuid().default(() => crypto.randomUUID()), {
            autogen: true, idField: true,
            unique: true, index: true
        });
        id.autoincrement = () => addMeta(z.number().default(0), { autogen: true, idField: true, unique: true, index: true });
        return id;
    }
    autouuid = () => {
        return addMeta(
            z.uuid().default(() => crypto.randomUUID()),
            { autogen: true }
        );
    }

    autoincrement = () => {
        return addMeta(
            z.number(),
            { autogen: true }
        );
    }

    now = () => {
        return addMeta(
            z.iso.datetime().default(() => new Date().toISOString()),
            { autogen: true, date: true }
        );
    }

    updatedAt = () => {
        return addMeta(
            z.iso.datetime().nullable().default(() => null),
            { autogen: true, date: true }
        );
    }
    oneFrom = <S extends z.ZodObject, Z extends z.ZodObject>(ref: TSchemaRef<S, Z>) => {
        return addMeta(ref.schema.optional(), { oneFrom: true })
    }
    manyFrom = <S extends z.ZodObject, Z extends z.ZodObject>(ref: TSchemaRef<S, Z>) => {
        return addMeta(z.array(ref.schema.optional()), { manyFrom: true })
    }
}
function withIndexMethods<T extends z.ZodType>(schema: T): T & FieldIndex {
    return Object.assign(schema, {
        unique() {
            return addMeta(schema, { unique: true });
        },
        index() {
            return addMeta(schema, { index: true });
        }
    });
}
const { string, number, date, bigint, ...rest } = z
export const lField = Object.assign({
    string: () => withIndexMethods(string()),
    number: () => withIndexMethods(number()),
    date: () => withIndexMethods(date()),
    bigint: () => withIndexMethods(bigint())
}, rest, new LField()) as typeof z & LField;
