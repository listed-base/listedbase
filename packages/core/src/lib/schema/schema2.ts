import { z } from "zod/v4";
export const schemaRegistry = new Map<string, z.ZodObject<any>>();
type SchemaBrand<Name extends string> = {
    __entityName: Name
}

type EntitySchema<
    Name extends string,
    Shape extends z.ZodRawShape
> =
    z.ZodObject<Shape> & SchemaBrand<Name>



export function lSchema2<
    Name extends string,
    Shape extends z.ZodRawShape
>(
    name: Name,
    fields: Shape
): EntitySchema<Name, Shape> {

    const schema = z.object(fields).meta({ name })

    schemaRegistry.set(name, schema)

    return schema as EntitySchema<Name, Shape>
}


type ExtractEntity<
    Name extends string,
    Schemas
> =
    Schemas extends { __entityName: Name }
    ? Schemas
    : never