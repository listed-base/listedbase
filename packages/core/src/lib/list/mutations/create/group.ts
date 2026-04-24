import { ZodObject } from 'zod/v4';
import { LInfer } from '../../../infers';
import {
  CreateGroupIntent,
  CreateGroupErrorMode,
  InferCreateGroupResult,
} from './result';

export type CreateBulkFn<S extends ZodObject<any>> = <
  Input extends LInfer<S>['createInput'],
  I extends CreateGroupIntent | undefined = undefined,
  Sel extends I extends 'confirm' | 'id' | 'count' | 'ids' | 'entity'
    ? undefined
    : LInfer<S>['selectArgs'] | undefined = undefined,
>(opts: {
  entities: Input[];
  refine?: {
    intent?: I;
    select?: Sel;
    count?: boolean;
    ids?: boolean;
    errorMode?: CreateGroupErrorMode;
  };
}) => Promise<
  InferCreateGroupResult<
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
