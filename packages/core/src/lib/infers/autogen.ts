import { IsAutoOnCreate, IsAutoOnUpdate } from '../schema/meta';
import { Clean, Simplify } from '../utils';
import { FieldOutput } from './unique';

// ============================================================
//  авто генерируемые поля
// ============================================================

export type AutoGenFields<T> = {
  [K in keyof T as IsAutoOnCreate<T[K]> extends true
    ? K
    : IsAutoOnUpdate<T[K]> extends true
      ? K
      : never]: FieldOutput<T[K]>;
};

export type InferAutoGenFields<T> = Clean<Simplify<AutoGenFields<T>>>;
