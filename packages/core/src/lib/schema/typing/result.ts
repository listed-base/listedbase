

type PickConfig<T> = {
  [K in keyof T]?: true;
};

type PickFiellds<T, S extends SelectConfig<T>> = Pick<T, keyof S & keyof T>;

