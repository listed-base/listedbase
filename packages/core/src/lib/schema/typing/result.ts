

type TConfig<T> = {
    [K in keyof T]?: true;
};

type PickFiellds<T, S extends TConfig<T>> = Pick<T, keyof S & keyof T>;




export interface Fields<T> {
    pick: TConfig<T>;
    omit: TConfig<T>;

}
export type ItmeShepa<T, TConfig extends FieldsConfig<T>> = PickFiellds<T, TConfig['pick']>
