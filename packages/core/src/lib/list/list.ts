import { ZodObject } from 'zod/v4';
import type {
  CreateIntent,
  CreateErrorMode,
  InferCreateResult,
} from './mutations';
import { z } from 'zod/v4';
import { getPrimarySource } from '@listedbase/driver-abstract';
import { LInfer } from '../infers';
import { LQueryRef } from '../query/query';

export function list<S extends ZodObject<any>>(query: LQueryRef<S>) {
  const schema = query.schema;
  const listName = schema.meta()?.id as string;
  const source = getPrimarySource();
  const driver = source.data;
  const schemas = z.toJSONSchema(z.globalRegistry);
  driver.ensureReady(schemas);

  type Infers = LInfer<S>;
  const items: Infers['base'][] = [];

  return {
    items,

    async create<
      Input extends Infers['createInput'],
      I extends CreateIntent | undefined = undefined,
      Sel extends I extends 'confirm' | 'id' | 'entity'
        ? undefined
        : Infers['selectArgs'] | undefined = undefined,
    >(opts: {
      input: Input;
      refine?: {
        intent?: I;
        select?: Sel;
        errorMode?: CreateErrorMode;
      };
    }): Promise<InferCreateResult<S, Input, { intent: I; select: Sel }>> {
      const parsed = schema.parse(opts.input);
      const result = await driver.create(listName, parsed);
      return result as InferCreateResult<S, Input, { intent: I; select: Sel }>;
    },
  };
}
