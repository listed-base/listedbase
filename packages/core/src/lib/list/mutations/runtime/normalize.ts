import { IDataDriver } from '@listedbase/driver-abstract';

export function normalizeWhere(where: any, driver: IDataDriver): any {
  if (where && typeof where === 'object') {
    const normalized: any = {};
    for (const [key, value] of Object.entries(where)) {
      normalized[key] = key === 'id' ? driver.serializeId(value) : value;
    }
    return normalized;
  }
  return driver.serializeId(where);
}
