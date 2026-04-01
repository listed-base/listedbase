import z, { keyof, ZodAny, ZodLiteral, ZodType } from "zod/v4"

export type TMeta<T = boolean> = {
    idField?: T,
    autogen?: T,
    unique?: T,
    index?: T,
    oneFrom?: T,
    manyFrom?: T,
    date?: T
}

const register = z.registry<TMeta>()

type RequiredMeta<T> = { [P in keyof T]-?: ZodLiteral<true>; }

export function addMeta<T extends ZodType, C extends TMeta>(schema: T, meta: C) {
    const marks = {} as RequiredMeta<C>
    for (const key in meta) {
        (marks as any)[key] = z.literal(true)
    }
    return schema.meta({ ...meta }).or(z.object(marks))

}   