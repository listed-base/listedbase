import { ZodObject } from 'zod/v4';
import { LInfer } from '../../../infers';
import {
  MutationIntent,
  RefineOptions,
  InferDeleteMutationResult,
  InferDeleteGroupMutationResult,
} from '../index';

export interface DeleteOp<S extends ZodObject<any>> {
  <
    Where extends LInfer<S>['uniqueArgs'] | LInfer<S>['uniqueArgs'][],
    I extends MutationIntent | undefined = undefined,
    Ref extends RefineOptions<S, I> | undefined = undefined
  >(
    where: Where,
    refine?: Ref
  ): Promise<
    Where extends any[]
      ? InferDeleteGroupMutationResult<S, I, Ref>
      : InferDeleteMutationResult<S, I, Ref>
  >;
}
