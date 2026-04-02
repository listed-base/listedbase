

type PickConfig<T> = {
  [K in keyof T]?: true;
};

type PickFiellds<T, S extends PickConfig<T>> = Pick<T, keyof S & keyof T>;


export inter
export interface ItmeShepa<T> {
    pick: PickFiellds<T, any>;
} 
