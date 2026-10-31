import { ZodObject } from 'zod/v4';
import { LInfer } from '../../../infers';
import {
  MutationIntent,
  RefineOptions,
  InferMutationResult,
  InferGroupMutationResult,
} from '../index';

export interface CreateOp<S extends ZodObject<any>> {
  <
    Input extends LInfer<S>['createInput'] | LInfer<S>['createInput'][],
    I extends MutationIntent | undefined = undefined,
    Ref extends RefineOptions<S, I> | undefined = undefined
  >(
    input: Input,
    refine?: Ref
  ): Promise<
    Input extends any[]
      ? InferGroupMutationResult<S, I, Ref>
      : InferMutationResult<S, I, Ref>
  >;
}
