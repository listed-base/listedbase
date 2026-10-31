import { LListContext } from '../../context';
import { LError } from '../../../error';
import { RefineOptions } from '../index';
import { toLError } from './errors';

export async function runGroup<
  TItem,
  TResult,
  TRefine extends RefineOptions<any, any> | undefined
>(
  ctx: LListContext<any>,
  items: TItem | TItem[],
  execute: (item: TItem) => Promise<TResult>,
  refine?: TRefine,
  fallbackErrorCode: import('../../../error').LErrorCode = 'DRIVER/UNKNOWN',
  fallbackMessage = 'Operation failed'
): Promise<any> {
  const driver = ctx.driver();
  const isArray = Array.isArray(items);
  const itemsToProcess = isArray ? (items as TItem[]) : [items];

  if (
    isArray &&
    !driver.capabilities.transactions &&
    refine?.errorMode !== 'settled'
  ) {
    throw new LError({
      code: 'DRIVER/UNSUPPORTED',
      message:
        'Array operations with rejectAll errorMode require driver transaction support.',
    });
  }

  const results: any[] = [];

  for (const item of itemsToProcess) {
    try {
      const result = await execute(item);
      ctx.onMutated(ctx.name);
      if (refine?.errorMode === 'settled') {
        results.push({ status: 'fulfilled', data: result });
      } else {
        results.push(result);
      }
    } catch (err: any) {
      const lErr = toLError(err, fallbackErrorCode, fallbackMessage);
      if (refine?.errorMode === 'settled') {
        results.push({ status: 'rejected', error: lErr });
      } else {
        throw lErr;
      }
    }
  }

  return isArray ? results : results[0];
}
