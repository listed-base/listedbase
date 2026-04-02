

type TConfig<T> = {
    [K in keyof T]?: true;
};

type PickFiellds<T, S extends TConfig<T>> = Pick<T, keyof S & keyof T>;




export interface ShepeOptions<T> {
    pick: TConfig<T>;
    omit: TConfig<T>;

}
export type applyShape<T, TConfig extends ShepeOptions<T>> = PickFiellds<T, TConfig['pick']>
