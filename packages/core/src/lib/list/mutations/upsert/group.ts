import { ZodObject } from 'zod/v4';
import { LInfer } from '../../../infers';
import {
  UpsertGroupIntent,
  UpsertGroupErrorMode,
  UpsertDiffSelect,
  InferUpsertGroupResult,
} from './result';

export type UpsertBulkFn<S extends ZodObject<any>> = <
  Input extends LInfer<S>['upsertInput'],
  I extends UpsertGroupIntent | undefined = undefined,
  Sel extends I extends 'diff'
    ? UpsertDiffSelect<S> | undefined
    : I extends
          | 'confirm'
          | 'action'
          | 'id'
          | 'count'
          | 'ids'
          | 'actions'
          | 'entity'
      ? undefined
      : LInfer<S>['selectArgs'] | undefined = I extends 'diff'
    ? UpsertDiffSelect<S> | undefined
    : I extends
          | 'confirm'
          | 'action'
          | 'id'
          | 'count'
          | 'ids'
          | 'actions'
          | 'entity'
      ? undefined
      : undefined,
>(opts: {
  onConflict?: keyof LInfer<S>['uniqueArgs'];

  entities: Input[];

  refine?: {
    intent?: I;
    select?: Sel;
    count?: boolean;
    ids?: boolean;
    errorMode?: UpsertGroupErrorMode;
  };
}) => Promise<
  InferUpsertGroupResult<
    S,
    Input,
    {
      intent: I;
      select: Sel;
      count: boolean;
      ids: boolean;
    }
  >
>;
