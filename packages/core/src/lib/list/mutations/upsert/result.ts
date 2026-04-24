import { ZodObject } from 'zod/v4';
import { ApplySelect } from '../../../infers/output';
import { LError } from '../../helpers/error';
import { LInfer } from '../../../infers';

// ============================================================
// Action
// ============================================================

export type UpsertAction = 'created' | 'updated';

// ============================================================
// Intent
// ============================================================

export type UpsertIntent =
  | 'confirm'
  | 'action'
  | 'id'
  | 'patch'
  | 'entity'
  | 'fullSelect'
  | 'diff';

export type UpsertGroupIntent =
  | UpsertIntent
  | 'count'
  | 'ids'
  | 'settled'
  | 'actions';

// ============================================================
// ErrorMode
// ============================================================

export type UpsertErrorMode = 'returned' | { throw: true };

export type UpsertGroupErrorMode =
  | 'returned'
  | { throw: 'rejectAll' }
  | { throw: 'settled' };

// ============================================================
// BaseFields
// ============================================================

export type BaseFields<S extends ZodObject<any>> =
  LInfer<S>['idField'] & LInfer<S>['uniqueArgs'];

// ============================================================
// DiffSelect
// ============================================================

export type UpsertDiffSelect<S extends ZodObject<any>> = {
  before: LInfer<S>['selectArgs'];
  after: LInfer<S>['selectArgs'];
};

// ============================================================
// SettledItem
// ============================================================

export type UpsertSettledItem<S extends ZodObject<any>, Input> =
  | {
      status: 'fulfilled';
      data:
        & BaseFields<S>
        & Partial<Input>
        & Partial<LInfer<S>['autogen']>
        & { $action: UpsertAction };
    }
  | { status: 'rejected'; error: LError };

// ============================================================
// ResolveSelect
// ============================================================

export type ResolveUpsertSelect<
  S extends ZodObject<any>,
  I extends UpsertIntent | UpsertGroupIntent | undefined,
> = I extends 'confirm' | 'action' | 'id' | 'count' | 'ids' | 'actions' | 'entity'
  ? undefined
  : I extends 'diff'
  ? UpsertDiffSelect<S> | undefined
  : LInfer<S>['selectArgs'] | undefined;

// ============================================================
// InferUpsertEntityShape
// ============================================================

export type InferUpsertEntityShape<
  S extends ZodObject<any>,
  Input,
  I extends UpsertIntent | UpsertGroupIntent | undefined,
  Sel extends LInfer<S>['selectArgs'] | UpsertDiffSelect<S> | undefined,
> = I extends 'confirm'
  ? boolean
  : I extends 'action'
  ? UpsertAction
  : I extends 'id'
  ? LInfer<S>['idType']
  : I extends 'count'
  ? number
  : I extends 'ids'
  ? LInfer<S>['idType'][]
  : I extends 'actions'
  ? { id: LInfer<S>['idType']; $action: UpsertAction }[]
  : I extends 'diff'
  ? Sel extends UpsertDiffSelect<S>
    ? {
        before?: ApplySelect<
          LInfer<S>['base'],
          LInfer<S>['populations'],
          Sel['before']
        >;
        after: ApplySelect<
          LInfer<S>['base'],
          LInfer<S>['populations'],
          Sel['after']
        >;
        $action: UpsertAction;
      }
    : {
        before?: LInfer<S>['base'];
        after: LInfer<S>['base'];
        $action: UpsertAction;
      }
  : I extends 'entity'
  ? LInfer<S>['base'] & { $action: UpsertAction }
  : Sel extends LInfer<S>['selectArgs']
  ? ApplySelect<LInfer<S>['base'], LInfer<S>['populations'], Sel> &
      { $action: UpsertAction }
  : I extends 'fullSelect'
  ? BaseFields<S> & LInfer<S>['base'] & { $action: UpsertAction }
  : I extends 'patch'
  ? BaseFields<S>
    & Partial<Input>
    & Partial<LInfer<S>['autogen']>
    & { $action: UpsertAction }
  : BaseFields<S> & Partial<Input> & Partial<LInfer<S>['autogen']>; // default

// ============================================================
// InferUpsertResult — single
// ============================================================

export type InferUpsertResult<
  S extends ZodObject<any>,
  Input,
  R extends
    | {
        intent?: UpsertIntent;
        select?: LInfer<S>['selectArgs'] | UpsertDiffSelect<S>;
        errorMode?: UpsertErrorMode;
      }
    | undefined,
> = R extends { intent?: infer I; select?: infer Sel }
  ? InferUpsertEntityShape<
      S,
      Input,
      I extends UpsertIntent ? I : undefined,
      Sel extends LInfer<S>['selectArgs'] | UpsertDiffSelect<S> ? Sel : undefined
    >
  : BaseFields<S> & Partial<Input> & Partial<LInfer<S>['autogen']>; // default

// ============================================================
// InferUpsertGroupResult — group
// ============================================================

export type InferUpsertGroupResult<
  S extends ZodObject<any>,
  Input,
  R extends
    | {
        intent?: UpsertGroupIntent;
        select?: LInfer<S>['selectArgs'] | UpsertDiffSelect<S>;
        count?: boolean;
        ids?: boolean;
        errorMode?: UpsertGroupErrorMode;
      }
    | undefined,
> = R extends { intent?: infer I }
  ? I extends 'confirm'
    ? boolean
    : I extends 'count'
    ? number
    : I extends 'ids'
    ? LInfer<S>['idType'][]
    : I extends 'actions'
    ? { id: LInfer<S>['idType']; $action: UpsertAction }[]
    : I extends 'settled'
    ? UpsertSettledItem<S, Input>[]
    : R extends { count: true } | { ids: true }
    ? {
        entities: InferUpsertEntityShape<
          S,
          Input,
          I extends UpsertGroupIntent ? I : undefined,
          R extends { select?: infer Sel }
            ? Sel extends LInfer<S>['selectArgs'] | UpsertDiffSelect<S>
              ? Sel
              : undefined
            : undefined
        >[];
      } &
        (R extends { count: true } ? { count: number } : unknown) &
        (R extends { ids: true } ? { ids: LInfer<S>['idType'][] } : unknown) &
        (R extends { errorMode: 'returned' } ? { $error: LError | null } : unknown)
    : InferUpsertEntityShape<
        S,
        Input,
        I extends UpsertGroupIntent ? I : undefined,
        R extends { select?: infer Sel }
          ? Sel extends LInfer<S>['selectArgs'] | UpsertDiffSelect<S>
            ? Sel
            : undefined
          : undefined
      >[]
  : (BaseFields<S> & Partial<Input> & Partial<LInfer<S>['autogen']>)[]; // default
