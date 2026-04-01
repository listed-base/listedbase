import {  LCreateInputWithType, PickUniqueProps } from "./main";

type UnwrapArray<T> = T extends (infer U)[] ? U : T;

type RelationObject<T> = Exclude<
    Extract<UnwrapArray<T>, object>,
    { oneFrom: true } | { manyFrom: true }
>;

type GetIdType<T> = {
    [K in keyof T]:
    Extract<T[K], { idField: true }> extends never
    ? never
    : Exclude<T[K], { idField: true }>
}[keyof T];


type HasManyFrom<T> =
    Extract<T, { manyFrom: true }> extends never ? false : true;

type HasOneFrom<T> =
    Extract<T, { oneFrom: true }> extends never ? false : true;


ex type TransformField<T> =
    HasManyFrom<T> extends true
    ? GetIdType<RelationObject<T>>[] | PickUniqueProps<T>
    : HasOneFrom<T> extends true
    ? GetIdType<RelationObject<T>>
    : T extends any[]
    ? GetIdType<RelationObject<T>>[]
    : T extends object
    ? GetIdType<T>
    : T;

type TransformUniqueField<T> =
    HasManyFrom<T> extends true
    ? PickUniqueProps<RelationObject<T>>[]
    : HasOneFrom<T> extends true
    ? PickUniqueProps<T>
    : T extends any[]
    ? PickUniqueProps<RelationObject<T>>[]
    : T extends object
    ? PickUniqueProps<T>
    : T;


type CreateInput<T> =
    HasManyFrom<T> extends true
    ? LCreateInputWithType<RelationObject<T>>[]
    : HasOneFrom<T> extends true
    ? LCreateInputWithType<RelationObject<T>>
    : T extends any[]
    ? LCreateInputWithType<RelationObject<T>>[]
    : T extends object
    ? LCreateInputWithType<T>
    : T;




export type IPupulate<T> = HasManyFrom<T> extends true ? {
    populate?: TransformUniqueField<T>;
    create?: CreateInput<T>;
} : HasOneFrom<T> extends true ? {
    populate?: TransformUniqueField<T>;
    create?: CreateInput<T>;
} : T
export type PopulationToInput<T> = {
    [K in keyof T]: IPupulate<T[K]>;
};