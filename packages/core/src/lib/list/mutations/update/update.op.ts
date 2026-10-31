import { ZodObject } from 'zod/v4';
import { LListContext } from '../../context';
import { UpdateOp } from './update.types';
import { runGroup } from '../runtime/runGroup';
import { project } from '../refine/project';
import { normalizeWhere } from '../runtime/normalize';
import { LError } from '../../../error';

export function updateOp<S extends ZodObject<any>>(
  ctx: LListContext<S>
): UpdateOp<S> {
  const partialSchema = ctx.schema.partial();

  return async (opts: any, refine?: any): Promise<any> => {
    return runGroup(
      ctx,
      opts,
      async (itemOpt: any) => {
        const driver = ctx.driver();
        const normalizedWhere = normalizeWhere(itemOpt.where, driver);
        const beforeRaw = await driver.findUnique(ctx.name, normalizedWhere);

        if (!beforeRaw) {
          throw new LError({
            code: 'DB/NOT_FOUND',
            message: 'Record not found for update.',
          });
        }

        // Validate partial update with Zod before writing
        const validatedInput = partialSchema.parse(itemOpt.input);

        const updateData = {
          ...validatedInput,
          updatedAt: new Date(),
        };

        const encodedInput = ctx.codec.encode(updateData);
        const updatedRaw = await driver.update(
          ctx.name,
          normalizedWhere,
          encodedInput
        );

        return project(
          'update',
          refine?.intent,
          beforeRaw,
          updatedRaw || { ...beforeRaw, ...encodedInput },
          refine?.select,
          driver,
          ctx.codec.decode
        );
      },
      refine,
      'DRIVER/UNKNOWN',
      'Update operation failed.'
    );
  };
}
