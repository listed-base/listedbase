import { createReactive } from '@listedbase/uni-reactive';
import { ZodObject } from 'zod/v4';
import { LInfer } from '../infers2';
export interface QueryOptions<S extends ZodObject> {
  where?: LInfer<S>['whereArgs'];
  sort?: LInfer<S>['sortArgs'];
  take?: number;
}
export type LQueryRef<S extends ZodObject, R = any> = {
  value: R;
  modify: (next: (prev: QueryOptions<S>) => QueryOptions<S>) => void;
  schema: S;
};
export function lQuery<S extends ZodObject>(
  schema: S,
  defaultQueryOptions: QueryOptions<S> = {},
) {
  const store = createReactive<QueryOptions<S>>();
  store.init(defaultQueryOptions);

  return {
    value: store.value,
    modify: store.modify.bind(store),
    schema,
  } as LQueryRef<S, typeof store.value>
}
