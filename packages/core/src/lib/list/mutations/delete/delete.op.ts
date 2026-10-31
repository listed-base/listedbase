import { ZodObject } from 'zod/v4';
import { LListContext } from '../../context';
import { DeleteOp } from './delete.types';
import { runGroup } from '../runtime/runGroup';
import { project } from '../refine/project';
import { normalizeWhere } from '../runtime/normalize';
import { LError } from '../../../error';

export function deleteOp<S extends ZodObject<any>>(
  ctx: LListContext<S>
): DeleteOp<S> {
  return async (where: any, refine?: any): Promise<any> => {
    return runGroup(
      ctx,
      where,
      async (whereItem: any) => {
        const driver = ctx.driver();
        const normalizedWhere = normalizeWhere(whereItem, driver);
        const beforeRaw = await driver.findUnique(ctx.name, normalizedWhere);

        if (!beforeRaw) {
          throw new LError({
            code: 'DB/NOT_FOUND',
            message: 'Record not found for delete.',
          });
        }

        await driver.delete(ctx.name, normalizedWhere);

        return project(
          'delete',
          refine?.intent,
          beforeRaw,
          null,
          refine?.select,
          driver,
          ctx.codec.decode
        );
      },
      refine,
      'DRIVER/UNKNOWN',
      'Delete operation failed.'
    );
  };
}
