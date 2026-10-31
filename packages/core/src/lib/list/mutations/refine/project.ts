import { IDataDriver } from '@listedbase/driver-abstract';
import { MutationIntent } from '../index';
import { applySelect } from './select';
import { DEFAULT_INTENTS, MutationOpName } from './defaults';

function calculateDiff(before: any, after: any): any {
  if (!before && !after) return {};
  if (!before) return { ...after };
  if (!after) return {};

  const changed: any = {};
  for (const key of Object.keys(after)) {
    if (after[key] !== before[key]) {
      changed[key] = after[key];
    }
  }
  return changed;
}

export function project(
  op: MutationOpName,
  intent: MutationIntent | undefined,
  beforeItem: any,
  afterItem: any,
  select: any,
  driver: IDataDriver,
  decode: (data: any) => any
): any {
  const activeIntent = intent || DEFAULT_INTENTS[op];

  if (activeIntent === 'confirm') return true;

  if (activeIntent === 'id') {
    const rawId = afterItem?.id || beforeItem?.id;
    return driver.serializeId(rawId);
  }

  if (activeIntent === 'diff') {
    return {
      before: beforeItem ? applySelect(decode(beforeItem), select) : null,
      after: afterItem ? applySelect(decode(afterItem), select) : null,
    };
  }

  // Handle operation-specific default projections when no explicit intent was provided
  if (!intent) {
    if (op === 'create') {
      const decoded = decode(afterItem);
      return applySelect({ id: driver.serializeId(afterItem?.id || decoded.id), createdAt: decoded.createdAt }, select);
    }
    if (op === 'update') {
      const decodedBefore = decode(beforeItem);
      const decodedAfter = decode(afterItem);
      const diffFields = calculateDiff(decodedBefore, decodedAfter);
      return applySelect(diffFields, select);
    }
    if (op === 'delete') {
      return true;
    }
    if (op === 'upsert') {
      const decoded = decode(afterItem);
      return applySelect({ id: driver.serializeId(decoded.id), $action: decoded.$action || 'created' }, select);
    }
  }

  // 'entity' intent (or explicit 'entity')
  const record = afterItem || beforeItem;
  const decoded = decode(record);
  if (record?.id) {
    decoded.id = driver.serializeId(record.id);
  }
  return applySelect(decoded, select);
}
