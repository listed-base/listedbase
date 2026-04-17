import z, { ZodObject } from "zod";

export type InferBase<S extends ZodObject> = DecomposeSchema<z.o>