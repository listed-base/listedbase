import { createReactive } from '@listedbase/uni-reactive';
import { TSchemaRef } from '../schema/schema';
import { LCreateInput, LItem, LUpdateInput, LWhereUniqueInput } from '../schema/typing/itme';
import { ApplyShapeOptions, ShepeOptions } from '../schema/typing/result';







// ─── Types ───────────────────────────────────────────────────────────────────

type SelectConfig<T> = {
  [K in keyof T]?: true;
};

type ApplySelect<T, S extends SelectConfig<T>> = Pick<T, keyof S & keyof T>;

//   type QueryConfig<T> = {
//     select: S extends SelectConfig<T> ? S : SelectConfig<T>;
//   };

// ─── Runtime Utility ─────────────────────────────────────────────────────────

function applySelect<T extends object, S extends SelectConfig<T>>(
  data: T,
  config: { select: S }
): ApplySelect<T, S> {
  const keys = Object.keys(config.select) as (keyof S & keyof T)[];
  return keys.reduce((acc, key) => {
    acc[key] = data[key];
    return acc;
  }, {} as ApplySelect<T, S>);
}



export function list<S extends TSchemaRef>(
  schema: S,
) {
  type Item = LItem<S>
  const store = createReactive<Item[]>()
  store.init([])
  const jsonSchema = schema.schema.toJSONSchema()

  return Object.assign({ items: store.value }, {



    async create(input: LCreateInput<S>) {


      const newItem = input as Item
      store.modify(prev => [...prev, newItem])
      return newItem
    },
    update(input: LUpdateInput<S>) {
      return { ...input } as Item
    },

    findMany<TShapeOptions extends ShepeOptions<Item>>(shape?: TShapeOptions) {

      return [] as ApplyShapeOptions<Item, TShapeOptions>[]
    },
    findUnique(input: LWhereUniqueInput<S>) {
      return { ...input } as Item
    },

  })
}


