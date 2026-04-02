export interface ItmeShepa<T> {
    pick: <S extends SelectConfig<T>>(select: S) => ApplySelect<T, S>;
} 


type PConfig<T> = {
  [K in keyof T]?: true;
};

type PickFiellds<T, S extends SelectConfig<T>> = Pick<T, keyof S & keyof T>;

