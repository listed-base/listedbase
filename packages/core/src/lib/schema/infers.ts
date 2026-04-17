import { ZodObject } from "zod";

export  InferBase<S extends ZodObject> = S['_def']['