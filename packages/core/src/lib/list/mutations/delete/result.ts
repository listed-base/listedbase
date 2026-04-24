import { ZodObject } from 'zod/v4';
import { ApplySelect } from '../../../infers/output';
import { LError } from '../../helpers/error';
import { LInfer } from '../../../infers';

// ============================================================
// Intent
// ============================================================

export type DeleteIntent =
  | 'confirm' // => boolean  (default)
  | 'id' // => IdType
  | 'entity' // => Full Entity
  | 'before'; // => Entity before delete + select

export type DeleteGroupIntent =
  | DeleteIntent
  | 'count' // => number
  | 'ids' // => IdType[]
  | 'settled'; // => SettledItem[]

// ============================================================
// ErrorMode
// ============================================================

export type DeleteErrorMode = 'returned' | { throw: true }; // default

export type DeleteGroupErrorMode =
  | 'returned'
  | { throw: 'rejectAll' } // default
  | { throw: 'settled' };

// ============================================================
// BaseFields
// ============================================================

export type BaseFields<
  S extends ZodObject<any>,
  W extends LInfer<S>['whereArgs'] | LInfer<S>['uniqueArgs'],
> = LInfer<S>['idField'] &
  (W extends LInfer<S>['uniqueArgs']
    ? W
    : Partial<Pick<LInfer<S>['base'], keyof W & keyof LInfer<S>['base']>>);

// ============================================================
// SettledItem
// ============================================================

export type DeleteSettledItem<
  S extends ZodObject<any>,
  W extends LInfer<S>['whereArgs'] | LInfer<S>['uniqueArgs'],
> =
  | { status: 'fulfilled'; data: BaseFields<S, W> }
  | { status: 'rejected'; error: LError };

// ============================================================
// ResolveSelect
// ============================================================

export type ResolveDeleteSelect<
  S extends ZodObject<any>,
  I extends DeleteIntent | DeleteGroupIntent | undefined,
> = I extends 'confirm' | 'id' | 'count' | 'ids' | 'entity'
  ? undefined
  : LInfer<S>['selectArgs'] | undefined;

// ============================================================
// InferDeleteEntityShape
// ============================================================

export type InferDeleteEntityShape<
  S extends ZodObject<any>,
  W extends LInfer<S>['whereArgs'] | LInfer<S>['uniqueArgs'],
  I extends DeleteIntent | DeleteGroupIntent | undefined,
  Sel extends LInfer<S>['selectArgs'] | undefined,
> = I extends 'confirm' | undefined
  ? boolean
  : I extends 'id'
  ? LInfer<S>['idType']
  : I extends 'count'
  ? number
  : I extends 'ids'
  ? LInfer<S>['idType'][]
  : // entity — full بدون select
  I extends 'entity'
  ? LInfer<S>['base']
  : // before — مع select
  I extends 'before'
  ? Sel extends LInfer<S>['selectArgs']
    ? ApplySelect<LInfer<S>['base'], LInfer<S>['populations'], Sel>
    : BaseFields<S, W> & LInfer<S>['base']
  : // settled
  I extends 'settled'
  ? DeleteSettledItem<S, W>[]
  : // default
    boolean;

// ============================================================
// InferDeleteResult — single
// ============================================================

export type InferDeleteResult<
  S extends ZodObject<any>,
  W extends LInfer<S>['whereArgs'] | LInfer<S>['uniqueArgs'],
  R extends
    | {
        intent?: DeleteIntent;
        select?: LInfer<S>['selectArgs'];
        errorMode?: DeleteErrorMode;
      }
    | undefined,
> = R extends { intent?: infer I; select?: infer Sel }
  ? InferDeleteEntityShape<
      S,
      W,
      I extends DeleteIntent ? I : undefined,
      Sel extends LInfer<S>['selectArgs'] ? Sel : undefined
    >
  : boolean; // default

// ============================================================
// InferDeleteGroupResult — group
// ============================================================

export type InferDeleteGroupResult<
  S extends ZodObject<any>,
  W extends LInfer<S>['whereArgs'] | LInfer<S>['uniqueArgs'],
  R extends
    | {
        intent?: DeleteGroupIntent;
        select?: LInfer<S>['selectArgs'];
        count?: boolean;
        ids?: boolean;
        errorMode?: DeleteGroupErrorMode;
      }
    | undefined,
> = R extends { intent?: infer I }
  ? I extends 'confirm' | undefined
    ? boolean
    : I extends 'count'
    ? number
    : I extends 'ids'
    ? LInfer<S>['idType'][]
    : I extends 'settled'
    ? DeleteSettledItem<S, W>[]
    : R extends { count: true } | { ids: true }
    ? {
        entities: InferDeleteEntityShape<
          S,
          W,
          I extends DeleteGroupIntent ? I : undefined,
          R extends { select?: infer Sel }
            ? Sel extends LInfer<S>['selectArgs']
              ? Sel
              : undefined
            : undefined
        >[];
      } &
        (R extends { count: true } ? { count: number } : unknown) &
        (R extends { ids: true } ? { ids: LInfer<S>['idType'][] } : unknown) &
        (R extends { errorMode: 'returned' } ? { $error: LError | null } : unknown)
    : InferDeleteEntityShape<
        S,
        W,
        I extends DeleteGroupIntent ? I : undefined,
        R extends { select?: infer Sel }
          ? Sel extends LInfer<S>['selectArgs']
            ? Sel
            : undefined
          : undefined
      >[]
  : boolean[]; // default
