
import { z } from "zod/v4";
import { LFilterInput } from "../filters/types";
import { FindImpl } from "./find";

type HasAuto<T> = Extract<T, { __auto: true }> extends never ? false : true;

type OmitMarkedAutoFields<T> = {
    [K in keyof T as HasAuto<T[K]> extends true ? never : K]: T[K];
};
// remove  { __auto: true } from T[K]
type RemoveAuto<T> = Exclude<T, { __auto: true }>;

export type RemoveAutoFields<T> = {
    [K in keyof T]: RemoveAuto<T[K]>;
};
export type OneCreateInput<T> = OmitMarkedAutoFields<T>;
export type OneUpdateInput<T> = Partial<OneCreateInput<T>>;

export type ManyCreateInput<T> = OneCreateInput<T>[];
export type ManyUpdateInput<T> = OneUpdateInput<T>[];

export type CreateInput<T> = OneCreateInput<T> | ManyCreateInput<T>;
export type UpdateInput<T> = OneUpdateInput<T> | ManyUpdateInput<T>;



export class ListMutationsImpl<TOutput, TInput, S extends z.ZodObject>
    extends FindImpl<TOutput, S> {
    constructor() {
        super();
    }
    create = (data: CreateInput<TInput>): TOutput => {
        const parsed = this.schema.schema.parse(data);
        console.log(parsed)
        const item = parsed as TOutput;
        this.state.modify(prev => [...prev, item]);
        return item;
    }



    update = (where: LFilterInput<TOutput>, data: UpdateInput<TInput>): TOutput | undefined => {
        let updated: TOutput | undefined;
        this.state.modify(prev => prev.map(item => {
            updated = { ...item, ...data } as TOutput;
            return updated;
            return item;
        }));
        return updated;
    };

    upsert = (data: UpdateInput<TInput>): void => {
        this.state.modify(prev => [...prev, data as TOutput]);
    };

    delete = (where: LFilterInput<TOutput>): boolean => {
        console.log("delete");
        return true;
    };

}