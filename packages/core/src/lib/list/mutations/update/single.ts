import { ZodObject } from 'zod/v4';
import { LInfer } from '../../../infers';
import {
  UpdateIntent,
  UpdateErrorMode,
  DiffSelect,
  InferUpdateResult,
} from './result';
export type UpdateFn<S extends ZodObject<any>> = <
  Input extends LInfer<S>['updateInput'],
  I extends UpdateIntent | undefined = undefined,
  Sel extends I extends 'diff'
    ? DiffSelect<S>
    : I extends 'confirm'
      ? never
      : LInfer<S>['selectArgs'] | undefined = I extends 'diff'
    ? DiffSelect<S>
    : I extends 'confirm'
      ? never
      : undefined,
>(opts: {
  where: LInfer<S>['uniqueArgs'];
  input: Input;
  refine?: {
    intent?: I;
    select?: Sel;
    errorMode?: UpdateErrorMode;
  };
}) => Promise<
  InferUpdateResult<S, LInfer<S>['uniqueArgs'], Input, { intent: I; select: Sel }>
>;

export type UpdateFirstFn<S extends ZodObject<any>> = <
  Input extends LInfer<S>['updateInput'],
  I extends UpdateIntent | undefined = undefined,
  Sel extends I extends 'diff'
    ? DiffSelect<S>
    : I extends 'confirm'
      ? never
      : LInfer<S>['selectArgs'] | undefined = I extends 'diff'
    ? DiffSelect<S>
    : I extends 'confirm'
      ? never
      : undefined,
>(opts: {
  where: LInfer<S>['whereArgs'];
  sort?: LInfer<S>['sortArgs'];
  take?: number;
  input: Input;
  refine?: {
    intent?: I;
    select?: Sel;
    errorMode?: UpdateErrorMode;
  };
}) => Promise<
  InferUpdateResult<S, LInfer<S>['whereArgs'], Input, { intent: I; select: Sel }>
>;
