import { ZodObject } from 'zod/v4';
import { LInfer } from '../../../infers';
import {
  UpsertIntent,
  UpsertErrorMode,
  UpsertDiffSelect,
  InferUpsertResult,
} from './result';


export type UpsertFn<S extends ZodObject<any>> = <
  Input extends LInfer<S>['upsertInput'],
  I extends UpsertIntent | undefined = undefined,
  Sel extends I extends 'diff'
    ? UpsertDiffSelect<S> | undefined
    : I extends 'confirm' | 'action' | 'id' | 'entity'
      ? undefined
      : LInfer<S>['selectArgs'] | undefined = I extends 'diff'
    ? UpsertDiffSelect<S> | undefined
    : I extends 'confirm' | 'action' | 'id' | 'entity'
      ? undefined
      : undefined,
>(opts: {
  onConflict?: keyof LInfer<S>['uniqueArgs'];

  input: Input;

  refine?: {
    intent?: I;
    select?: Sel;
    errorMode?: UpsertErrorMode;
  };
}) => Promise<
  InferUpsertResult<
    S,
    Input,
    {
      intent: I;
      select: Sel;
    }
  >
>;
