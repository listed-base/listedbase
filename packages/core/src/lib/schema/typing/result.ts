

type Config<T> = {
    [K in keyof T]?: true;
};

type PickFiellds<T, S extends PickConfig<T>> = Pick<T, keyof S & keyof T>;




export interface FieldsConfig<T> {
    pick: Config<T>;
    // omit: PickConfig<T>;
}
export type ItmeShepa<T, TConfig extends FieldsConfig<T>>  = PickFiellds<T, TConfig['pick']>
