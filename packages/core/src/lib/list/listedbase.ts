import { Item } from './../../duct/types';
import { z, ZodObject, ZodRawShape } from 'zod/v4';
import * as v4 from 'zod/v4/core';

export type ListEventType = 'create' | 'update' | 'remove';

export interface ListEvent<T> {
  type: ListEventType;
  index: number;
  item: T;
}

// type RemoveAuotMarks<T> = {
//   [P in keyof T]: Exclude<T[P], { __auto: true }>
// }
export function list<S extends z.ZodObject>(schema: S) {

  type Item = z.output<S>
  type ItemInput = z.input<S>

  return { items: [] as Item[] }
}



