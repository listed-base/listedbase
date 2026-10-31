import { ZodObject } from 'zod/v4';
import { LInfer } from '../../infers';
import { ApplySelect } from '../../infers/output';
import { LError } from '../../error';

// ============================================================
// Intents
// ============================================================

export type MutationIntent = 'confirm' | 'id' | 'entity' | 'diff';
export type ManyMutationIntent = MutationIntent | 'count';

// ============================================================
// ErrorModes
// ============================================================

export type MutationErrorMode = 'returned' | { throw: true } | 'settled';

// ============================================================
// Options / Refine
// ============================================================

export type RefineOptions<
  S extends ZodObject<any>,
  I extends MutationIntent | ManyMutationIntent | undefined = undefined
> = {
  intent?: I;
  select?: I extends 'entity' | 'diff' ? LInfer<S>['selectArgs'] : never;
  errorMode?: MutationErrorMode;
};

// ============================================================
// Settled Item
// ============================================================

export type SettledResult<T> =
  | { status: 'fulfilled'; data: T }
  | { status: 'rejected'; error: LError };

// ============================================================
// Diff Shapes
// ============================================================

export type EntityDiff<T> = {
  before: Partial<T> | null;
  after: Partial<T> | null;
};

// ============================================================
// Infer Shape Resolution
// ============================================================

export type InferSingleShape<
  S extends ZodObject<any>,
  I extends MutationIntent | undefined,
  Sel,
  DefaultIntent extends MutationIntent = 'entity'
> = I extends 'confirm'
  ? boolean
  : I extends 'id'
  ? LInfer<S>['idType']
  : I extends 'diff'
  ? EntityDiff<LInfer<S>['base']>
  : Sel extends LInfer<S>['selectArgs']
  ? ApplySelect<LInfer<S>['base'], LInfer<S>['populations'], Sel>
  : I extends 'entity'
  ? LInfer<S>['base']
  : DefaultIntent extends 'confirm'
  ? boolean
  : LInfer<S>['base'];

export type InferDeleteShape<
  S extends ZodObject<any>,
  I extends MutationIntent | undefined,
  Sel
> = InferSingleShape<S, I, Sel, 'confirm'>;

export type InferMutationResult<
  S extends ZodObject<any>,
  I extends MutationIntent | undefined,
  Ref extends RefineOptions<S, I> | undefined
> = Ref extends { errorMode: 'settled' }
  ? SettledResult<InferSingleShape<S, I, Ref extends { select?: infer Sel } ? Sel : undefined>>
  : InferSingleShape<S, I, Ref extends { select?: infer Sel } ? Sel : undefined>;

export type InferGroupMutationResult<
  S extends ZodObject<any>,
  I extends MutationIntent | undefined,
  Ref extends RefineOptions<S, I> | undefined
> = Ref extends { errorMode: 'settled' }
  ? SettledResult<InferSingleShape<S, I, Ref extends { select?: infer Sel } ? Sel : undefined>>[]
  : InferSingleShape<S, I, Ref extends { select?: infer Sel } ? Sel : undefined>[];

export type InferDeleteMutationResult<
  S extends ZodObject<any>,
  I extends MutationIntent | undefined,
  Ref extends RefineOptions<S, I> | undefined
> = Ref extends { errorMode: 'settled' }
  ? SettledResult<InferDeleteShape<S, I, Ref extends { select?: infer Sel } ? Sel : undefined>>
  : InferDeleteShape<S, I, Ref extends { select?: infer Sel } ? Sel : undefined>;

export type InferDeleteGroupMutationResult<
  S extends ZodObject<any>,
  I extends MutationIntent | undefined,
  Ref extends RefineOptions<S, I> | undefined
> = Ref extends { errorMode: 'settled' }
  ? SettledResult<InferDeleteShape<S, I, Ref extends { select?: infer Sel } ? Sel : undefined>>[]
  : InferDeleteShape<S, I, Ref extends { select?: infer Sel } ? Sel : undefined>[];

// ============================================================
// Results
// ============================================================

export type ManyResult = {
  count: number;
};
