import { z } from 'zod/v4';
import { SchemaRef } from '../schema/schema';
import { ListImpl } from './list';
import { RemoveAutoFields } from './mutation';

export type ListEventType = 'create' | 'update' | 'remove';

export interface ListEvent<T> {
  type: ListEventType;
  index: number;
  item: T;
}


export function list<S extends z.ZodObject>(
  schema: SchemaRef<S>,
) {

  type Item = RemoveAutoFields<z.output<S>>;
  type ItemInput = z.input<S>;
  const provider = new ListImpl<Item, ItemInput, S>(schema);
  return provider
}

