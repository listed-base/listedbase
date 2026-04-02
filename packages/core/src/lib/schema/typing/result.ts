

type PickConfig<T> = {
  [K in keyof T]?: true;
};

type PickFiellds<T, S extends PickConfig<T>> = Pick<T, keyof S & keyof T>;



export interface ItmeShepa<T> {
    pick: ;
} 
