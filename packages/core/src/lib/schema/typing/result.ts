export interface ItmeShepa<T> {
    pick: <S extends SelectConfig<T>>(select: S) => ApplySelect<T, S>;
} 


type SelectConfig<T> = {
  [K in keyof T]?: true;
};

typePick<T, S extends SelectConfig<T>> = Pick<T, keyof S & keyof T>;

