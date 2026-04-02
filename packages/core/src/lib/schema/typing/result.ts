export interface ItmeShepa<T> 


type SelectConfig<T> = {
  [K in keyof T]?: true;
};

type ApplySelect<T, S extends SelectConfig<T>> = Pick<T, keyof S & keyof T>;

