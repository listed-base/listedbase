import { z, ZodRawShape, ZodObject } from "zod";


class PopularField<S extends z.ZodObject<any> = any> {

    private schema?: S

    readonly zod: z.ZodTypeAny

    constructor(private many: boolean) {

        this.zod = z.lazy(() => {

            if (!this.schema) {
                throw new Error("Relation schema not set")
            }

            return this.many
                ? z.array(this.schema)
                : this.schema
        })
    }

    set(schema: S) {
        this.schema = schema
    }

}

class PopularImpl {

    oneFrom() {
        return z.object()
    }

    manyFrom() {
        return z.array(z.object())
    }

}

export const lField = new PopularImpl();



export function lSchema<
    TShape extends z.ZodRawShape
>(
    name: string,
    fields: TShape
) {

    const shape: z.ZodRawShape = {}



    const schema = z.object(shape) as z.ZodObject<TShape>

    return {
        name,
        schema,
        shape: fields
    }
}

export class ListImpl<Item, ItemInput> {
    items: Item[] = [];

    constructor(public schema: ZodObject<any>) { }
}

export function list<S extends z.ZodObject<any>>(schema: S) {

    type Item = z.output<S>
    type ItemInput = z.input<S>

    return new ListImpl<Item, ItemInput>(schema)
}