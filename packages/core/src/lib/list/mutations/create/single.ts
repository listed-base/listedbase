import { ZodObject } from 'zod/v4';
import { LInfer } from '../../../infers';
import {
  CreateIntent,
  CreateErrorMode,
  InferCreateResult,
} from './result';

export type CreateFn<S extends ZodObject<any>> = <
  Input extends LInfer<S>['createInput'],
  I extends CreateIntent | undefined = undefined,
  Sel extends I extends 'confirm' | 'id' | 'entity'
    ? undefined
    : LInfer<S>['selectArgs'] | undefined = undefined,
>(opts: {
  input: Input;
  refine?: {
    intent?: I;
    select?: Sel;
    errorMode?: CreateErrorMode;
  };
}) => Promise<InferCreateResult<S, Input, { intent: I; select: Sel }>>;
