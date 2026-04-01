import { never, z, ZodLazy, ZodObject, ZodUnion } from "zod/v4";
import core, { util } from "zod/v4/core";
interface TSchemaOptions<TName extends string, TFields extends core.$ZodLooseShape> {
    name: TName,
    fields: TFields
}

type ResolveLazy<T> =
    T extends () => infer R
    ? ResolveLazy<R>
    : T;
type ResolveFields<T> = {
    [K in keyof T]: ResolveLazy<T[K]>;
};

/**
 * Extract first schema from ZodUnion
 */
type FirstFromZodUnion<T> =
    T extends z.ZodUnion<infer Options>
    ? Options extends [infer First, ...any[]]
    ? First
    : never
    : T;

/**
 * Apply on object fields
 */
type PickFirstUnionFields<T> = {
    [K in keyof T]: FirstFromZodUnion<T[K]>;
};
export interface TSchemaRef<S extends ZodObject = ZodObject, Z extends ZodObject = ZodObject> {
    schema: S
    zodSchema: Z,
    // jsonSchema: core.ZodStandardJSONSchemaPayload<S> & { idField: string }
}
export const registerSchema = new Map<string, ZodObject>()
export function lSchema<
    TName extends string,
    TFields extends Record<string, any>
>(
    { name, fields }: TSchemaOptions<TName, TFields>
): TSchemaRef<ZodObject<ResolveFields<TFields>, core.$strict>, ZodObject<ResolveFields<PickFirstUnionFields<TFields>>, core.$strict>> {

    const resolvedShape: any = {};
    let hasIdFiled = false
    for (const key in fields) {
        const value = fields[key];

        if (typeof value === "function") {
            resolvedShape[key] = z.lazy(() => value().options[0])

        } else {
            resolvedShape[key] = value;
        }

        const field = resolvedShape[key];


        if (field instanceof ZodUnion) {
            if (field.options[1] instanceof ZodObject && Object.prototype.hasOwnProperty.call(field.options[1].shape, "idField")) {
                hasIdFiled = true
            }
            resolvedShape[key] = field.options[0];
        }

    }

    if (!hasIdFiled) {
        throw new Error(`listedbase:Schema ${name} must have an id field`);
    }

    const def: core.$ZodObjectDef = {
        type: "object",
        shape: resolvedShape,
        catchall: never(),
    };

    const schema = (z.object(def)).meta({ name }) as any
    z.globalRegistry.add(schema, { id: name })

    return {
        schema,
        zodSchema: sc,
    }
}

class SchemaRef<S extends ZodObject, Z extends ZodObject> implements TSchemaRef<S, Z> {
    schema: S
    zodSchema: Z
    constructor(schema: S, zodSchema: Z) {
        this.schema = schema
        this.zodSchema = zodSchema
    }

}















