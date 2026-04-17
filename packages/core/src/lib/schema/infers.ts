import z, { ZodObject } from "zod";

export type InferBase<S extends ZodObject> = DecomposeSchema<z.output<S>>['base'];
export type InferIdFields<S extends ZodObject> = DecomposeSchema<z.output<S>>['idFields'];