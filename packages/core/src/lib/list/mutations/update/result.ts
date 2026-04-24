import { ZodObject } from 'zod/v4';
import { LError } from '../../helpers/error';
import { ApplySelect } from '../../../infers/output';
import { LInfer } from '../../../infers';

// ============================================================
// Intent
// ============================================================

export type UpdateIntent =
  | 'confirm'
  | 'patch'
  | 'entity'
  | 'fullSelect'
  | 'diff';

export type UpdateGroupIntent =
  | UpdateIntent
  | 'count'
  | 'ids'
  | 'settled';

// ============================================================
// ErrorMode
// ============================================================

export type UpdateErrorMode = 'returned' | { throw: true };

export type UpdateGroupErrorMode =
  | 'returned'
  | { throw: 'rejectAll' }
  | { throw: 'settled' };

// ============================================================
// BaseFields
// ============================================================

export type BaseFields<
  S extends ZodObject<any>,
  W extends LInfer<S>['whereArgs'] | LInfer<S>['uniqueArgs'],
> = LInfer<S>['idField'] & (W extends LInfer<S>['uniqueArgs']
    ? W
    : Partial<Pick<LInfer<S>['base'], keyof W & keyof LInfer<S>['base']>>);

// ============================================================
// DiffSelect
// ============================================================

export type DiffSelect<S extends ZodObject<any>> = {
  before: LInfer<S>['selectArgs'];
  after: LInfer<S>['selectArgs'];
};

// ============================================================
// Settled
// ============================================================

export type SettledItem<
  S extends ZodObject<any>,
  W extends LInfer<S>['whereArgs'] | LInfer<S>['uniqueArgs'],
  Input,
> =
  | { status: 'fulfilled'; data: BaseFields<S, W> & Partial<Input> & Partial<LInfer<S>['autogen']> }
  | { status: 'rejected'; error: LError };

// ============================================================
// InferEntityShape
// ============================================================

export type InferEntityShape<
  S extends ZodObject<any>,
  W extends LInfer<S>['whereArgs'] | LInfer<S>['uniqueArgs'],
  Input,
  I extends UpdateIntent | UpdateGroupIntent | undefined,
  Sel extends LInfer<S>['selectArgs'] | DiffSelect<S> | undefined,
> = I extends 'confirm'
  ? boolean
  : I extends 'count'
  ? number
  : I extends 'ids'
  ? LInfer<S>['idType'][]
  : Sel extends LInfer<S>['selectArgs']
  ? ApplySelect<LInfer<S>['base'], LInfer<S>['populations'], Sel>
  : I extends 'diff'
  ? Sel extends DiffSelect<S>
    ? {
        before: ApplySelect<
          LInfer<S>['base'],
          LInfer<S>['populations'],
          Sel['before']
        >;
        after: ApplySelect<
          LInfer<S>['base'],
          LInfer<S>['populations'],
          Sel['after']
        >;
      }
    : {
        before: BaseFields<S, W> & LInfer<S>['base'];
        after: BaseFields<S, W> & LInfer<S>['base'];
      }
  : I extends 'entity'
  ? LInfer<S>['base']
  : I extends 'fullSelect'
  ? BaseFields<S, W> & LInfer<S>['base']
  : I extends 'patch'
  ? BaseFields<S, W> & Partial<Input> & Partial<LInfer<S>['autogen']>
  : BaseFields<S, W> & Partial<LInfer<S>['autogen']>; // default

// ============================================================
// InferUpdateResult — single
// ============================================================

export type InferUpdateResult<
  S extends ZodObject<any>,
  W extends LInfer<S>['whereArgs'] | LInfer<S>['uniqueArgs'],
  Input,
  R extends
    | {
        intent?: UpdateIntent;
        select?: LInfer<S>['selectArgs'] | DiffSelect<S>;
        errorMode?: UpdateErrorMode;
      }
    | undefined,
> = R extends { intent?: infer I; select?: infer Sel }
  ? InferEntityShape<
      S,
      W,
      Input,
      I extends UpdateIntent ? I : undefined,
      Sel extends LInfer<S>['selectArgs'] | DiffSelect<S> ? Sel : undefined
    >
  : BaseFields<S, W> & Partial<LInfer<S>['autogen']>; // default

// ============================================================
// InferUpdateGroupResult — group
// ============================================================

export type InferUpdateGroupResult<
  S extends ZodObject<any>,
  W extends LInfer<S>['whereArgs'] | LInfer<S>['uniqueArgs'],
  Input,
  R extends
    | {
        intent?: UpdateGroupIntent;
        select?: LInfer<S>['selectArgs'] | DiffSelect<S>;
        count?: boolean;
        ids?: boolean;
        errorMode?: UpdateGroupErrorMode;
      }
    | undefined,
> = R extends { intent?: infer I }
  ? I extends 'confirm'
    ? boolean
    : I extends 'count'
    ? number
    : I extends 'ids'
    ? LInfer<S>['idType'][]
    : I extends 'settled'
    ? SettledItem<S, W, Input>[]
    : R extends { count: true } | { ids: true }
    ? {
        entities: InferEntityShape<
          S,
          W,
          Input,
          I extends UpdateGroupIntent ? I : undefined,
          R extends { select?: infer Sel }
            ? Sel extends LInfer<S>['selectArgs'] | DiffSelect<S>
              ? Sel
              : undefined
            : undefined
        >[];
      } &
        (R extends { count: true } ? { count: number } : unknown) &
        (R extends { ids: true } ? { ids: LInfer<S>['idType'][] } : unknown) &
        (R extends { errorMode: 'returned' } ? { $error: LError | null } : unknown)
    : InferEntityShape<
        S,
        W,
        Input,
        I extends UpdateGroupIntent ? I : undefined,
        R extends { select?: infer Sel }
          ? Sel extends LInfer<S>['selectArgs'] | DiffSelect<S>
            ? Sel
            : undefined
          : undefined
      >[]
  : (BaseFields<S, W> & Partial<LInfer<S>['autogen']>)[]; // default
