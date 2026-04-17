import z, { ZodObject } from "zod";
import { DecomposeSchema } from "./typing";

export type InferBase<S extends ZodObject> = DecomposeSchema<z.output<S>>['base'];
export type InferIdFields<S extends ZodObject> = DecomposeSchema<z.output<S>>['idFields'];
export type InferUniqueFields<S extends ZodObject> = DecomposeSchema<z.output<S>>['uniqueFields'];
export