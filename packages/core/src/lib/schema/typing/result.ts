

type TConfig<T> = {
    [K in keyof T]?: true;
};

type LPickFields<T, S extends TConfig<T>> = Pick<T, keyof S & keyof T>;
type LOmitFields<T, S extends TConfig<T>> = Omit<T, keyof S & keyof T>;




export interface ShepeOptions<T> {
    pick: TConfig<T>;
    omit: TConfig<T>;

}
export type ApplyShapeOptions<T, TOptions extends ShepeOptions<T>> = TOptions extends { pick: infer TPick }
    ? TPick extends TConfig<T>
    ? LPickFields<T, TPick>
