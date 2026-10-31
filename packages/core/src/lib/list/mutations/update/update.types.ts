import { ZodObject } from 'zod/v4';
import { LInfer } from '../../../infers';
import {
  MutationIntent,
  RefineOptions,
  InferMutationResult,
  InferGroupMutationResult,
} from '../index';

export interface UpdateOp<S extends ZodObject<any>> {
  <
    Opts extends
      | { where: LInfer<S>['uniqueArgs']; input: LInfer<S>['updateInput'] }
      | Array<{ where: LInfer<S>['uniqueArgs']; input: LInfer<S>['updateInput'] }>,
    I extends MutationIntent | undefined = undefined,
    Ref extends RefineOptions<S, I> | undefined = undefined
  >(
    opts: Opts,
    refine?: Ref
  ): Promise<
    Opts extends any[]
      ? InferGroupMutationResult<S, I, Ref>
      : InferMutationResult<S, I, Ref>
  >;
}
