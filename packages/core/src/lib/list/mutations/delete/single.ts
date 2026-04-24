import { ZodObject } from 'zod/v4';
import { LInfer } from '../../../infers';
import {
  DeleteIntent,
  DeleteErrorMode,
  InferDeleteResult,
} from './result';

// delete
export type DeleteFn<S extends ZodObject<any>> = <
  I extends DeleteIntent | undefined = undefined,
  Sel extends I extends 'before'
    ? LInfer<S>['selectArgs'] | undefined
    : undefined = undefined,
>(opts: {
  where: LInfer<S>['uniqueArgs'];
  refine?: {
    intent?: I;
    select?: Sel;
    errorMode?: DeleteErrorMode;
  };
}) => Promise<
  InferDeleteResult<S, LInfer<S>['uniqueArgs'], { intent: I; select: Sel }>
>;

// deleteFirst
export type DeleteFirstFn<S extends ZodObject<any>> = <
  I extends DeleteIntent | undefined = undefined,
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
    errorMode?: DeleteErrorMode;
  };
}) => Promise<
  InferDeleteResult<S, LInfer<S>['whereArgs'], { intent: I; select: Sel }>
>;
