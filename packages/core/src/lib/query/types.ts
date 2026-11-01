import { ZodObject } from 'zod/v4';
import { LInfer } from '../infers';
import { LList } from '../list/api';
import { LError } from '../error';

export interface QueryManyArgs<S extends ZodObject<any>> {
  where?: LInfer<S>['whereArgs'];
  sort?: LInfer<S>['sortArgs'];
  take?: number;
}

export interface StatusSelection {
  count?: boolean;
  error?: boolean;
  loading?: boolean;
  refreshing?: boolean;
}

export type SelectedStatus<Sel extends StatusSelection> = {
  [K in keyof Sel as Sel[K] extends true ? K : never]: K extends 'count'
    ? () => number
    : K extends 'error'
    ? () => LError | null
    : K extends 'loading'
    ? () => boolean
    : K extends 'refreshing'
    ? () => boolean
    : never;
};

export interface LQueryBase<TData, TArgs> {
  data: () => TData;
  value: () => TArgs;
  modify: (updater: (prev: TArgs) => TArgs) => void;
  status: <Sel extends StatusSelection>(selection?: Sel) => SelectedStatus<Sel>;
  destroy: () => void;
}

export interface LQueryManyInstance<S extends ZodObject<any>>
  extends LQueryBase<LInfer<S>['base'][], QueryManyArgs<S>> {
  hasNext: () => boolean;
  loadNext: () => Promise<void>;
}

export interface LQueryIdsInstance<S extends ZodObject<any>>
  extends LQueryBase<LInfer<S>['base'][], string[]> {}

export interface LQuerySingleInstance<S extends ZodObject<any>>
  extends LQueryBase<LInfer<S>['base'] | null, { where: LInfer<S>['whereArgs'] }> {}

export interface LQueryFunction {
  <S extends ZodObject<any>>(
    list: LList<S>,
    args?: QueryManyArgs<S>
  ): LQueryManyInstance<S>;

  <S extends ZodObject<any>>(
    list: LList<S>,
    ids: string[]
  ): LQueryIdsInstance<S>;

  single<S extends ZodObject<any>>(
    list: LList<S>,
    args: { where: LInfer<S>['whereArgs'] }
  ): LQuerySingleInstance<S>;
}
