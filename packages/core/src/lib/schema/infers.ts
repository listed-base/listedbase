import z, { ZodObject } from "zod";
import { DecomposeSchema } from "./typing";

export type InferBase<S extends ZodObject> = DecomposeSchema<z.output<S>>['base'];
export type InferIdFields<S extends ZodObject> = DecomposeSchema<z.output<S>>['idFields'];
export type InferUniqueFields<S extends ZodObject> = DecomposeSchema<z.output<S>>['uniqueFields'];
export type InferIndexFields<S extends ZodObject> = DecomposeSchema<z.output<S>>['indexFields'];
export type InferPopulateQraph<S extends ZodObject> = DecomposeSchema<z.output<S>>['populateQraph'];
export type InferOnCreate<S extends ZodObject> = DecomposeSchema<z.output<S>>['autogenFields']["onCreate"];
export type InferOnUpdate<S extends ZodObject> = DecomposeSchema<z.output<S>>['autogenFields']["onUpdate"];

export type InferBaseInput<S extends ZodObject> = DecomposeSchema<z.input<S>>['base'];
export type InferIdFieldsInput<S extends ZodObject> = DecomposeSchema<z.input<S>>['idFields'];
export type InferUniqueFieldsInput<S extends ZodObject> = DecomposeSchema<z.input<S>>['uniqueFields'];
export type InferIndexFieldsInput<S extends ZodObject> = DecomposeSchema<z.input<S>>['indexFields'];
export type InferPopulateQraphInput<S extends ZodObject> = DecomposeSchema<z.input<S>>['populateQraph'];
export type InferOnCreateInput<S extends ZodObject> = DecomposeSchema<z.input<S>>['autogenFields']["onCreate"];
export type InferOnUpdateInput<S extends ZodObject> = DecomposeSchema<z.input<S>>['autogenFields']["onUpdate"];


export type ItemCreateInput<S extends ZodObject> = InferBase<S> & Omit