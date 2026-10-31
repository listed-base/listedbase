import { ZodObject } from 'zod/v4';
import { LListContext } from '../../context';
import { UpdateOp } from './update.types';
import { runGroup } from '../runtime/runGroup';
import { project } from '../refine/project';
import { normalizeWhere } from '../runtime/normalize';
import { LError } from '../../../error';
import { MutationPlan } from '../runtime/plan';

export function updateOp<S extends ZodObject<any>>(
  ctx: LListContext<S>
): UpdateOp<S> {
  const partialSchema = ctx.schema.partial();

  return async (opts: any, refine?: any): Promise<any> => {
    return runGroup(
      ctx,
      'update',
      opts,
      async (itemOpt: any, plan: MutationPlan) => {
        const driver = ctx.driver();
        const normalizedWhere = normalizeWhere(itemOpt.where, driver);

        let beforeRaw: any = null;
        if (plan.before === 'core' || refine?.intent === 'diff' || !refine?.intent) {
          beforeRaw = await driver.findUnique(ctx.name, normalizedWhere);
          if (!beforeRaw) {
            throw new LError({
              code: 'DB/NOT_FOUND',
              message: 'Record not found for update.',
            });
          }
        }

        // Validate partial update with Zod
        const validatedInput = partialSchema.parse(itemOpt.input);

        const updateData = {
          ...validatedInput,
          ...(plan.timestamps === 'core' ? { updatedAt: new Date() } : {}),
        };

        const encodedInput = ctx.codec.encode(updateData);
        const updatedRaw = await driver.update(
          ctx.name,
          normalizedWhere,
          encodedInput
        );

        const resultRecord =
          plan.returning === 'driver' && updatedRaw
            ? updatedRaw
            : { ...(beforeRaw || {}), ...encodedInput };

        return project(
          'update',
          refine?.intent,
          beforeRaw,
          resultRecord,
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
