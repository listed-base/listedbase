import { ZodObject } from 'zod/v4';
import { ManyResult } from '../index';

export interface UpdateManyOp<S extends ZodObject<any>> {
  (opts: any, refine?: any): Promise<ManyResult>;
}
