import { z, ZodObject } from 'zod/v4';
import { LFilterInput, LReactiveFilterType } from './filters/types';
import { container, REACTIVE_ADAPTER, UniRAdapterInterface } from '@listedbase/uni-reactive';
import { SchemaRef } from './schema/schema';
import { inject, injectable } from 'inversify';

export type ListEventType = 'create' | 'update' | 'remove';

export interface ListEvent<T> {
  type: ListEventType;
  index: number;
  item: T;
}

type HasAuto<T> = Extract<T, { __auto: true }> extends never ? false : true;

type OmitMarkedAutoFields<T> = {
  [K in keyof T as HasAuto<T[K]> extends true ? never : K]: T[K];
};

export interface ListRef<T> {
  items: T[];

  create: (data: T[]) => T;
  update: (where: LFilterInput<T>, data: Partial<T>) => T | undefined;
  upsert: (data: Partial<T>[]) => void;
  delete: (where: LFilterInput<T>) => boolean;

  findUnique: (where: Partial<T>) => T | undefined;
  findFirst: (options?: LFilterInput<T>) => T | undefined;
  findMany: (options?: LFilterInput<T>) => T[];
}

export function list<TReactive extends UniRAdapterInterface, TSchema extends ZodObject>(
  schema: SchemaRef<TSchema>,
  options: {
    reactive: TReactive;
    filters?: LReactiveFilterType<z.infer<TSchema>>;
  },
) {
  type Item = z.output<TSchema>;
  type ItemInput = OmitMarkedAutoFields<z.input<TSchema>>;

  const promiseList = async (params?: LFilterInput<Item>) => {
    console.log('promise list', params);
    return [] as Item[];
  };
  const rItems = options.reactive.fromAsync<Item[], LFilterInput<Item>>(
    (p) => promiseList(p),
    options.filters ? options.filters : undefined,
  );

  const it = container.get<UniRAdapterInterface>(REACTIVE_ADAPTER).from([]);
  return {
    items: it.value,
    create(input: ItemInput) {
      console.log('create', input);
    },
    findMany(input: LFilterInput<Item>) {
      console.log('findMany', input);
    },
  }

}

