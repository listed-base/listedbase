import { ZodObject } from 'zod/v4';
import {
  InferIdField,
  InferIdFieldType,
  InferUniqueArgs,
} from './unique';
import {
  InferCreateInput,
  InferUpdateInput,
  InferUpsertInput,
} from './inputs';
import { InferWhereArgs } from './where';
import { InferSortArgs } from './sort';
import { InferSelect } from './select';
import { InferEntity, InferEntityPopulate } from './entity';
import { InferAutoGenFields } from './autogen';

export interface LInfer<S extends ZodObject<any>> {
  idField: InferIdField<S['shape']>;
  idType: InferIdFieldType<S['shape']>;
  base: InferEntity<S['shape']>;
  populations: InferEntityPopulate<S['shape']>;
  createInput: InferCreateInput<S['shape']>;
  updateInput: InferUpdateInput<S['shape']>;
  upsertInput: InferUpsertInput<S['shape']>;
  uniqueArgs: InferUniqueArgs<S['shape']>;
  whereArgs: InferWhereArgs<S['shape']>;
  sortArgs: InferSortArgs<S['shape']>;
  selectArgs: InferSelect<S['shape']>;
  autogen: InferAutoGenFields<S['shape']>;
}

export { intersect, union, exclude } from './where';
