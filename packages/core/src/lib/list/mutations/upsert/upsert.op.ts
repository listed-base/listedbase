import { ZodObject } from 'zod/v4';
import { LListContext } from '../../context';
import { UpsertOp } from './upsert.types';
import { LError } from '../../../error';

export function upsertOp<S extends ZodObject<any>>(
  _ctx: LListContext<S>
): UpsertOp<S> {
  return async (_opts: any, _refine?: any): Promise<any> => {
    throw new LError({
      code: 'DRIVER/UNSUPPORTED',
      message: 'upsert is not supported in Phase 3 runtime.',
    });
  };
}
