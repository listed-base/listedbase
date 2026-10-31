import { ZodObject } from 'zod/v4';
import { IDataDriver, getPrimarySource } from '@listedbase/driver-abstract';
import { z } from 'zod/v4';
import { createCodec, ILCodec } from './codec';

export interface LListContext<S extends ZodObject<any>> {
  schema: S;
  name: string;
  driver: () => IDataDriver;
  codec: ILCodec;
  onMutated: (listName: string) => void;
}

export function createListContext<S extends ZodObject<any>>(
  schema: S
): LListContext<S> {
  const name = schema.meta()?.id as string;

  let cachedDriver: IDataDriver | null = null;
  const getDriver = (): IDataDriver => {
    if (!cachedDriver) {
      const source = getPrimarySource();
      cachedDriver = source.data;
      try {
        const schemas = z.toJSONSchema(z.globalRegistry);
        cachedDriver.ensureReady(schemas);
      } catch {
        cachedDriver.ensureReady({});
      }
    }
    return cachedDriver;
  };

  return {
    schema,
    name,
    driver: getDriver,
    codec: createCodec(schema),
    onMutated: (_listName: string) => {
      // no-op for now; will invalidate items later
    },
  };
}
