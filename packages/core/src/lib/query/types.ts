import { ZodObject } from 'zod/v4';
import { IReactive } from '@listedbase/uni-reactive';
import { LInfer } from '../infers';
import { ApplySelect } from '../infers/output';
import { LList } from '../list/api';
import { LError } from '../error';

export interface QueryManyArgs<S extends ZodObject<any>> {
  where?: LInfer<S>['whereArgs'];
  sort?: LInfer<S>['sortArgs'];
  take?: number;
  select?: LInfer<S>['selectArgs'];
}

export type ResolveSelected<S extends ZodObject<any>, Sel> = Sel extends LInfer<S>['selectArgs']
  ? ApplySelect<LInfer<S>['base'], LInfer<S>['populations'], Sel>
  : LInfer<S>['base'];

// ============================================================
// Status Selections
// ============================================================

export interface ManyStatusSelection {
  count?: boolean;
  exists?: boolean;
  error?: boolean;
}

export interface SingleStatusSelection {
  exists?: boolean;
  error?: boolean;
}

export type SelectedStatus<Sel extends ManyStatusSelection> = {
  [K in keyof Sel as Sel[K] extends true ? K : never]: K extends 'count'
    ? () => number
    : K extends 'exists'
    ? () => boolean
    : K extends 'error'
    ? () => LError | null
    : never;
};

// ============================================================
// Query Instances
// ============================================================

export interface LQueryManyInstance<S extends ZodObject<any>, Args extends QueryManyArgs<S> = QueryManyArgs<S>> {
  data: IReactive<ResolveSelected<S, Args['select']>[]>['value'];
  value: () => Args;
  modify: (updater: (prev: Args) => Args) => void;
  status: <Sel extends ManyStatusSelection>(selection?: Sel) => SelectedStatus<Sel>;
  hasNext: () => boolean;
  loadNext: () => Promise<void>;
}

export interface LQueryIdsInstance<S extends ZodObject<any>, Sel extends LInfer<S>['selectArgs'] | undefined = undefined> {
  data: IReactive<ResolveSelected<S, Sel>[]>['value'];
  value: () => string[];
  modify: (updater: (prev: string[]) => string[]) => void;
  status: <SelStatus extends ManyStatusSelection>(selection?: SelStatus) => SelectedStatus<SelStatus>;
}

export interface LQuerySingleInstance<S extends ZodObject<any>, Sel extends LInfer<S>['selectArgs'] | undefined = undefined> {
  data: IReactive<ResolveSelected<S, Sel> | null>['value'];
  value: () => { where: LInfer<S>['whereArgs']; select?: Sel };
  modify: (updater: (prev: { where: LInfer<S>['whereArgs']; select?: Sel }) => { where: LInfer<S>['whereArgs']; select?: Sel }) => void;
  status: <SelStatus extends SingleStatusSelection>(selection?: SelStatus) => SelectedStatus<SelStatus>;
}

// ============================================================
// Main lQuery Function Interface
// ============================================================

export interface LQueryFunction {
  <S extends ZodObject<any>, Args extends QueryManyArgs<S>>(
    list: LList<S>,
    args?: Args
  ): LQueryManyInstance<S, Args>;

  <S extends ZodObject<any>>(
    list: LList<S>,
    ids: string[]
  ): LQueryIdsInstance<S>;

  single<S extends ZodObject<any>, Args extends { where: LInfer<S>['whereArgs']; select?: LInfer<S>['selectArgs'] }>(
    list: LList<S>,
    args: Args
  ): LQuerySingleInstance<S, Args['select']>;
}

export declare const lQuery: LQueryFunction;
