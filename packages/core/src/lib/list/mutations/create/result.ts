import { ZodObject } from 'zod/v4';
import { ApplySelect } from '../../../infers/output';
import { LError } from '../../helpers/error';
import { LInfer } from '../../../infers';

// ============================================================
// Intent
// ============================================================

export type CreateIntent =
  | 'confirm' // => boolean
  | 'id' // => IdType
  | 'entity' // => Full Entity
  | 'fullSelect'; // => BaseFields & Entity

export type CreateGroupIntent =
  | CreateIntent
  | 'count' // => number
  | 'ids' // => IdType[]
  | 'settled'; // => SettledItem[]

// ============================================================
// ErrorMode
// ============================================================

export type CreateErrorMode = 'returned' | { throw: true }; // default

export type CreateGroupErrorMode =
  | 'returned'
  | { throw: 'rejectAll' } // default
  | { throw: 'settled' };

// ============================================================
// SettledItem
// ============================================================

export type CreateSettledItem<S extends ZodObject<any>, Input> =
  | { status: 'fulfilled'; data: LInfer<S>['idField'] & Partial<LInfer<S>['autogen']> }
  | { status: 'rejected'; error: LError };

// ============================================================
// ResolveSelect
// ============================================================

export type ResolveCreateSelect<
  S extends ZodObject<any>,
  I extends CreateIntent | CreateGroupIntent | undefined,
> = I extends 'confirm' | 'id' | 'count' | 'ids' | 'entity'
  ? undefined
  : LInfer<S>['selectArgs'];

// ============================================================
// InferCreateEntityShape
// ============================================================

export type InferCreateEntityShape<
  S extends ZodObject<any>,
  I extends CreateIntent | CreateGroupIntent | undefined,
  Sel extends LInfer<S>['selectArgs'] | undefined,
> = I extends 'confirm'
  ? boolean
  : I extends 'id'
  ? LInfer<S>['idType']
  : I extends 'count'
  ? number
  : I extends 'ids'
  ? LInfer<S>['idType'][]
  : I extends 'entity'
  ? LInfer<S>['base']
  : Sel extends LInfer<S>['selectArgs']
  ? ApplySelect<LInfer<S>['base'], LInfer<S>['populations'], Sel>
  : I extends 'fullSelect'
  ? LInfer<S>['idField'] & LInfer<S>['base']
  : LInfer<S>['idField'] & Partial<LInfer<S>['autogen']>; // default

// ============================================================
// InferCreateResult — single
// ============================================================

export type InferCreateResult<
  S extends ZodObject<any>,
  Input,
  R extends
    | {
        intent?: CreateIntent;
        select?: LInfer<S>['selectArgs'];
        errorMode?: CreateErrorMode;
      }
    | undefined,
> = R extends { intent?: infer I; select?: infer Sel }
  ? InferCreateEntityShape<
      S,
      I extends CreateIntent ? I : undefined,
      Sel extends LInfer<S>['selectArgs'] ? Sel : undefined
    >
  : LInfer<S>['idField'] & Partial<LInfer<S>['autogen']>; // default

// ============================================================
// InferCreateGroupResult — group
// ============================================================

export type InferCreateGroupResult<
  S extends ZodObject<any>,
  Input,
  R extends
    | {
        intent?: CreateGroupIntent;
        select?: LInfer<S>['selectArgs'];
        count?: boolean;
        ids?: boolean;
        errorMode?: CreateGroupErrorMode;
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
    ? CreateSettledItem<S, Input>[]
    : R extends { count: true } | { ids: true }
    ? {
        entities: InferCreateEntityShape<
          S,
          I extends CreateGroupIntent ? I : undefined,
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
    : InferCreateEntityShape<
        S,
        I extends CreateGroupIntent ? I : undefined,
        R extends { select?: infer Sel }
          ? Sel extends LInfer<S>['selectArgs']
            ? Sel
            : undefined
          : undefined
      >[]
  : (LInfer<S>['idField'] & Partial<LInfer<S>['autogen']>)[]; // default
