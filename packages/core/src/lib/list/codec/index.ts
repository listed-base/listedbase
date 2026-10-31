import { ZodObject, z } from 'zod/v4';

export interface ILCodec {
  encode(data: any): any;
  decode(data: any): any;
}

export function createCodec<S extends ZodObject<any>>(schema: S): ILCodec {
  // Find which fields are dates in the schema
  const shape = schema.shape;
  const dateFieldKeys = new Set<string>();

  for (const key of Object.keys(shape)) {
    const fieldType = shape[key];
    // Check if the field is z.date or resolves to date
    const meta = fieldType?.__lMeta || (fieldType?.description ? JSON.parse(fieldType.description) : null);
    if (
      fieldType instanceof z.ZodDate ||
      fieldType?._def?.typeName === 'ZodDate' ||
      meta?.type === 'date' ||
      fieldType?.unwrap?.() instanceof z.ZodDate
    ) {
      dateFieldKeys.add(key);
    }
  }

  const codecInstance: ILCodec = {
    encode(data: any): any {
      if (!data || typeof data !== 'object') return data;
      const result = Array.isArray(data) ? [...data] : { ...data };
      for (const key of Object.keys(result)) {
        if (dateFieldKeys.has(key) && result[key] instanceof Date) {
          result[key] = result[key].toISOString();
        } else if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = codecInstance.encode(result[key]);
        }
      }
      return result;
    },

    decode(data: any): any {
      if (!data || typeof data !== 'object') return data;
      const result = Array.isArray(data) ? [...data] : { ...data };
      for (const key of Object.keys(result)) {
        if (
          dateFieldKeys.has(key) &&
          typeof result[key] === 'string' &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result[key])
        ) {
          result[key] = new Date(result[key]);
        } else if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = codecInstance.decode(result[key]);
        }
      }
      return result;
    },
  };

  return codecInstance;
}

export class LCodec {
  static encode(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const result = Array.isArray(data) ? [...data] : { ...data };
    for (const key of Object.keys(result)) {
      if (result[key] instanceof Date) {
        result[key] = result[key].toISOString();
      } else if (typeof result[key] === 'object') {
        result[key] = LCodec.encode(result[key]);
      }
    }
    return result;
  }

  static decode(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const result = Array.isArray(data) ? [...data] : { ...data };
    for (const key of Object.keys(result)) {
      if (
        typeof result[key] === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result[key])
      ) {
        result[key] = new Date(result[key]);
      } else if (typeof result[key] === 'object') {
        result[key] = LCodec.decode(result[key]);
      }
    }
    return result;
  }
}
