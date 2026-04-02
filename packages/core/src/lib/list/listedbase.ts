import { createReactive } from '@listedbase/uni-reactive';
import { TSchemaRef } from '../schema/schema';
import { LCreateInput, LItem, LUpdateInput, LWhereUniqueInput } from '../schema/typing/itme';







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
  type item = LItem<S>| A
  const store = createReactive<LItem<S>[]>()
  store.init([])
  type Item = LItem<S>
  const json = schema.schema.toJSONSchema()
  const props = json.properties as Record<string, any>
  const oneFromFields = Object.entries(props).filter(([, value]) => (value as any).oneFrom).map(([key, value]) => ({ [key]: value }))
  const manyFromFields = Object.entries(props).filter(([, value]) => (value as any).manyFrom).map(([key, value]) => ({ [key]: value }))
  console.log(manyFromFields);

  return Object.assign({ items: store.value }, {


    async create(input: LCreateInput<S>) {
      if (oneFromFields.length) {
        for (const field of oneFromFields) {
          const key = Object.keys(field)[0]
          const value = (input as Record<string, unknown>)[key]
          if (typeof value === 'object' && value !== null && 'create' in value) {
            (input as any)[key] = (value as any).create
          }

        }

      }

      const newItem = input as Item
      store.modify(prev => [...prev, newItem])
      return newItem
    },
    update(input: LUpdateInput<S>) {
      return { ...input } as Item
    },

    findMany<S extends SelectConfig<Item>>(config?: { select: S }) {
      if (config) {
        store.modify(prev => prev.map(item => applySelect(item, config)))
      }
      return store.value
    },
    findUnique(input: LWhereUniqueInput<S>) {
      return { ...input } as Item
    },

  })
}


