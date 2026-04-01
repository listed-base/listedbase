import { keyof, z, ZodObject, ZodRawShape } from "zod/v4";

type TFields = ZodRawShape | { [x: string]: (<S extends ZodObject>() => S) }
export interface TSchemaOptions<TName extends string, TShape extends ZodRawShape> {
    name: TName,
    fields: TShape;
}

type UnwrapField<T> =
    T extends () => infer R
    ? R
    : T;

type ResolveShape<T extends TFields> = {
    [K in keyof T]: UnwrapField<T[K]>;
};

export type lSchemaRef<TShape extends ZodRawShape> = ZodObject<TShape>
export function lSchema<TName extends string, TShape extends ZodRawShape>(options: TSchemaOptions<TName, TShape>): lSchemaRef<TShape> {

    return z.object(options.fields)
}