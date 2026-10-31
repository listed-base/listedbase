import { ZodObject } from 'zod/v4';
import { LListContext } from '../../context';
import { CreateOp } from './create.types';
import { runGroup } from '../runtime/runGroup';
import { project } from '../refine/project';

function generateAutogenFields(schema: ZodObject<any>): Record<string, any> {
  const generated: Record<string, any> = {};
  const shape = schema.shape;

  for (const key of Object.keys(shape)) {
    const field = shape[key];
    const meta = field?.__lMeta || (field?.description ? JSON.parse(field.description) : null);

    if (meta?.idField === true && meta?.autogen === true) {
      generated[key] = crypto.randomUUID();
    } else if (meta?.autogen === true && meta?.type === 'date') {
      generated[key] = new Date();
    }
  }

  // Fallbacks if not explicitly marked via meta
  if (!('id' in generated) && 'id' in shape) {
    generated['id'] = crypto.randomUUID();
  }
  if (!('createdAt' in generated) && 'createdAt' in shape) {
    generated['createdAt'] = new Date();
  }

  return generated;
}

export function createOp<S extends ZodObject<any>>(
  ctx: LListContext<S>
): CreateOp<S> {
  return async (input: any, refine?: any): Promise<any> => {
    return runGroup(
      ctx,
      input,
      async (rawItem: any) => {
        const autogenFields = generateAutogenFields(ctx.schema);

        // Core generates autogen fields, rawItem cannot override autogen values
        const itemWithDefaults = {
          ...rawItem,
          ...autogenFields,
        };

        const parsed = ctx.schema.parse(itemWithDefaults);
        const encoded = ctx.codec.encode(parsed);
        const createdRaw = await ctx.driver().create(ctx.name, encoded);

        return project(
          'create',
          refine?.intent,
          null,
          createdRaw || encoded,
          refine?.select,
          ctx.driver(),
          ctx.codec.decode
        );
      },
      refine,
      'DRIVER/UNKNOWN',
      'Create operation failed.'
    );
  };
}
