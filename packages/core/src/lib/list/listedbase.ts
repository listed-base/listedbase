import { Item } from './../../duct/types';
import { z, ZodObject, ZodRawShape } from 'zod/v4';
import * as v4 from 'zod/v4/core';
import { TSchemaRef } from '../schema/schema';
import { LCreateInput, LCreateInput, LItem, LUpdateInput } from '../schema/typing/main';

export type ListEventType = 'create' | 'update' | 'remove';

export interface ListEvent<T> {
  type: ListEventType;
  index: number;
  item: T;
}

// type RemoveAuotMarks<T> = {
//   [P in keyof T]: Exclude<T[P], { __auto: true }>
// }
export function listb<S extends z.ZodObject>(schema: S) {

  type Item = z.output<S>
  type ItemInput = z.input<S>

  return { items: [] as Item[] }
}


export interface ListEvent<T> {
    type: ListEventType;
    index: number;
    item: T;
}

type HasAuto<T> = Extract<T, { __auto: true }> extends never ? false : true;

type OmitMarkedAutoFields<T> = {
    [K in keyof T as HasAuto<T[K]> extends true ? never : K]: T[K]
};





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
  
  // ─── Example Usage ───────────────────────────────────────────────────────────
  
  type User = {
    id: number;
    name: string;
    email: string;
    password: string;
  };
  
  function findUser<S extends SelectConfig<User>>(
    config: { select: S }
  ): ApplySelect<User, S> {
    const user: User = {
      id: 1,
      name: "Fathi",
      email: "fathi@example.com",
      password: "secret",
    };
  
    return applySelect(user, config);
  }
  
  // ✅ result type => Pick<User, "name" | "email">
  const result = findUser({
    select: { name: true, email: true },
  });
  
export function list<S extends TSchemaRef>(
    schema: S,
) {

    type Item = LItem<S>
    const json = schema.schema.toJSONSchema()
    const props = json.properties as any
    const oneFromFields = Object.entries(props).filter(([key, value]: any) => value.oneFrom).map(([key, value]) => ({ [key]: value }))
    const manyFromFields = Object.entries(props).filter(([key, value]: any) => value.manyFrom).map(([key, value]) => ({ [key]: value }))
    console.log(manyFromFields);

    return Object.assign({ items: [] as Item[] }, {


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
            // const parsed = schema.schema.parse(input);
            // console.log(input);


            // console.log(parsed);



        },
        update(input: LUpdateInput<S>) {

        },

        findMany<S extends SelectConfig<Item>>( config?: S) {
            return {} as ApplySelect<Item, S>
        },
        findUniqe(input: LWhereUniqueInput<S>) {

        },

    })
}


