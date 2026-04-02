

type PickConfig<T> = {
  [K in keyof T]?: true;
};

type PickFiellds<T, S extends PickConfig<T>> = Pick<T, keyof S & keyof T>;


export interface FieldsConfig<T> {
    pick: PickConfig<T>;
}
export interface ItmeShepa<T> {
    pick: PickFiellds<T, any>;
} 
