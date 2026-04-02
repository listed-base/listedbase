

type TConfig<T> = {
    [K in keyof T]?: true;
};

export interface ShepeOptions<T> {
    pick?: TConfig<T>;
    omit?: TConfig<T>;
}
type LPickFields<T, S extends TConfig<T>> = Pick<T, keyof S & keyof T>;
type LOmitFields<T, S extends TConfig<T>> = Omit<T, keyof S & keyof T>;




export type ApplyShapeOptions<T, TOptions extends ShepeOptions<T>> = TOptions extends { pick: infer TPick }
    ? TPick extends TConfig<T>
    ? LPickFields<T, TPick>
    : never
    : TOptions extends { omit: infer TOmit }
    ? TOmit extends TConfig<T>
    ? LOmitFields<T, TOmit>
    : never
    : T;
