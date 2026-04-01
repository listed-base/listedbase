import { TSchemaRef } from '../schema/schema';
import { LCreateInput, LItem, LUpdateInput, LWhereUniqueInput } from '../schema/typing/main';



   



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
  const store = new B
  type Item = LItem<S>
  const json = schema.schema.toJSONSchema()
  const props = json.properties as any
  const oneFromFields = Object.entries(props).filter(([key, value]: any) => value.oneFrom).map(([key, value]) => ({ [key]: value }))
  const manyFromFields = Object.entries(props).filter(([key, value]: any) => value.manyFrom).map(([key, value]) => ({ [key]: value }))
  console.log(manyFromFields);

  return Object.assign({ items: store.value }, {


    async create(input: LCreateInput<S>) {
      if (oneFromFields.length) {
        for (const field of oneFromFields) {
          const key = Object.keys(field)[0]
          const value = (input as Record<string, any>)[key]
          if (Object.prototype.hasOwnProperty.call(value, 'create')) {
            (input as any)[key] = value.create
          }

        }

      }
     



    },
    update(input: LUpdateInput<S>) {
      return { ...input } as Item
    },

    findMany<S extends SelectConfig<Item>>(config?: S) {
      return {} as ApplySelect<Item, S>
    },
    findUniqe(input: LWhereUniqueInput<S>) {
      return { ...input } as Item
    },

  })
}


