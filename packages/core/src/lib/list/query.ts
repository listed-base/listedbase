import { ZodObject } from 'zod/v4';

export interface TQueryRef<S extends ZodObject<any> = any> {
  query: string;
  schema: S;
}

export function lQuery<S extends ZodObject<any>>(
  schema: S,
  options?: never,
): TQueryRef<S> {
  return {
    query: '',
    schema,
  };
}
