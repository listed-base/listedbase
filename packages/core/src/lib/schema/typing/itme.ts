import z, { ZodObject } from "zod/v4";
import { TMeta } from "../meta";
import { TSchemaRef } from "../schema";
import { PopulationToInput } from "./populate";



// list item output type
type ExcludeUnionMark<T> = Exclude<T, TMeta>;


type ExcludeUnionMarks<T> =
  T extends Array<infer U>
  ? ExcludeUnionMarks<U>[]
  : T extends object
  ? {
    [K in keyof T]: ExcludeUnionMarks<ExcludeUnionMark<T[K]>>;
  }
  : ExcludeUnionMark<T>;

export type LItem<T extends TSchemaRef<ZodObject, ZodObject>> = ExcludeUnionMarks<z.output<T["schema"]>>;

// mutations itema input types
type HasAutoGenMarks<T> =
  Extract<T, { autogen: true }> extends never ? false : true;

type OmitPropsHasAutoGenMarks<T> = {
  [K in keyof T as HasAutoGenMarks<T[K]> extends true ? never : K]: T[K];
};

export type LCreateInputWithType<T> =
  ExcludeUnionMarks<
    PopulationToInput<
      OmitPropsHasAutoGenMarks<
        T>>>

export type LCreateInput<T extends TSchemaRef<ZodObject, ZodObject>> =
  ExcludeUnionMarks<
    PopulationToInput<
      OmitPropsHasAutoGenMarks<
        z.input<T["schema"]>>>>
export type LUpdateInput<T extends TSchemaRef<ZodObject, ZodObject>> = Partial<LCreateInput<T>>


// filter items types

// pick uniqeu  filelds

type HasUnique<T> =
  Extract<T, { unique: true }> extends never ? false : true;

export type PickUniqueProps<T> = {
  [K in keyof T as HasUnique<T[K]> extends true ? K : never]: T[K];
};

export type LWhereUniqueInput<T extends TSchemaRef<ZodObject, ZodObject>> = Partial<ExcludeUnionMarks<PickUniqueProps<z.input<T["schema"]>>>>



