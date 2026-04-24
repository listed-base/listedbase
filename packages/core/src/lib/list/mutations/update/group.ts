import { ZodObject } from 'zod/v4';
import { LInfer } from '../../../infers'
import {
  UpdateGroupIntent,
  UpdateGroupErrorMode,
  DiffSelect,
  InferUpdateGroupResult,
} from './result'

export type UpdateManyFn<S extends ZodObject<any>> = <
  Input extends LInfer<S>['updateInput'],
  I extends UpdateGroupIntent | undefined = undefined,

  Sel extends (
    I extends 'diff'
      ? DiffSelect<S>
      : I extends ('confirm' | 'count' | 'ids')
        ? never
        : LInfer<S>['selectArgs'] | undefined
  ) = (
    I extends 'diff'
      ? DiffSelect<S>
      : I extends ('confirm' | 'count' | 'ids')
        ? never
        : undefined
  ),

>(opts: {
  where: LInfer<S>['whereArgs']
  sort?: LInfer<S>['sortArgs']
  take?: number
  input: Input

  refine?: {
    intent?: I
    select?: Sel
    count?: boolean
    ids?: boolean
    errorMode?: UpdateGroupErrorMode
  }

}) => Promise<
  InferUpdateGroupResult<
    S,
    LInfer<S>['whereArgs'],
    Input,
    {
      intent: I
      select: Sel
      count: boolean
      ids: boolean
    }
  >
>

export type UpdateBulkFn<S extends ZodObject<any>> = <
  Input extends LInfer<S>['updateInput'],
  I     extends UpdateGroupIntent | undefined = undefined,
  Sel extends (
    I extends 'diff'
      ? DiffSelect<S>
      : I extends ('confirm' | 'count' | 'ids')
        ? never
        : LInfer<S>['selectArgs'] | undefined
  ) = (
    I extends 'diff'
      ? DiffSelect<S>
      : I extends ('confirm' | 'count' | 'ids')
        ? never
        : undefined
  ),
>(opts: {
  entities: { where: LInfer<S>['uniqueArgs']; input: Input }[]
  refine?:  {
    intent?:    I
    select?:    Sel
    count?:     boolean
    ids?:       boolean
    errorMode?: UpdateGroupErrorMode
  }
}) => Promise<InferUpdateGroupResult<S, LInfer<S>['uniqueArgs'], Input, {
  intent: I
  select: Sel
  count:  boolean
  ids:    boolean
}>>
