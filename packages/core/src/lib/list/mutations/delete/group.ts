import { ZodObject } from 'zod/v4';
import { LInfer } from '../../../infers';
import {
  DeleteGroupIntent,
  DeleteGroupErrorMode,
  InferDeleteGroupResult,
} from './result';

// deleteMany
export type DeleteManyFn<S extends ZodObject<any>> = <
  I extends DeleteGroupIntent | undefined = undefined,
  Sel extends I extends 'before'
    ? LInfer<S>['selectArgs'] | undefined
    : undefined = undefined,
>(opts: {
  where: LInfer<S>['whereArgs'];
  sort?: LInfer<S>['sortArgs'];
  take?: number;
  refine?: {
    intent?: I;
    select?: Sel;
    count?: boolean;
    ids?: boolean;
    errorMode?: DeleteGroupErrorMode;
  };
}) => Promise<
  InferDeleteGroupResult<
    S,
    LInfer<S>['whereArgs'],
    {
      intent: I;
      select: Sel;
      count: boolean;
      ids: boolean;
    }
  >
>;

// deleteBulk
export type DeleteBulkFn<S extends ZodObject<any>> = <
  I extends DeleteGroupIntent | undefined = undefined,
  Sel extends I extends 'before'
    ? LInfer<S>['selectArgs'] | undefined
    : undefined = undefined,
>(opts: {
  entities: LInfer<S>['uniqueArgs'][];
  refine?: {
    intent?: I;
    select?: Sel;
    count?: boolean;
    ids?: boolean;
    errorMode?: DeleteGroupErrorMode;
  };
}) => Promise<
  InferDeleteGroupResult<
    S,
    LInfer<S>['uniqueArgs'],
    {
      intent: I;
      select: Sel;
      count: boolean;
      ids: boolean;
    }
  >
>;
