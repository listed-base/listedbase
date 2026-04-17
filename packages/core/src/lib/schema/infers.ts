import { ZodObject } from "zod";

export type InferBase<S extends ZodObject> = DecomposeSchema<