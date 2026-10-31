import { ZodObject } from 'zod/v4';

export interface UpsertOp<S extends ZodObject<any>> {
  (opts: any, refine?: any): Promise<any>;
}
