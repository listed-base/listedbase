import { ZodObject } from 'zod/v4';
import { LListContext } from '../../context';
import { UpdateManyOp } from './update-many.types';
import { ManyResult } from '../index';
import { LError } from '../../../error';

export function updateManyOp<S extends ZodObject<any>>(
  _ctx: LListContext<S>
): UpdateManyOp<S> {
  return async (_opts: any, _refine?: any): Promise<ManyResult> => {
    throw new LError({
      code: 'DRIVER/UNSUPPORTED',
      message: 'updateMany is not supported in Phase 3 runtime.',
    });
  };
}
