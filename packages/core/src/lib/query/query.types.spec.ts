import { describe, it, expectTypeOf } from 'vitest';
import { IReactive } from '@listedbase/uni-reactive';
import { lSchema } from '../schema/schema';
import { lField } from '../schema/field';
import { LError } from '../error';
import {
  lQuery,
  LQueryManyInstance,
  LQueryIdsInstance,
  LQuerySingleInstance,
  ManyStatusSelection,
  SingleStatusSelection,
  SelectedStatus,
} from './types';

const userSchema = lSchema({
  name: 'User',
  fields: {
    id: lField.id.autouuid(),
    name: lField.string(),
    age: lField.number(),
  },
});

describe('lQuery type-level tests', () => {
  it('should infer data type without select', () => {
    type QMany = LQueryManyInstance<typeof userSchema, { take: 10 }>;
    expectTypeOf<QMany['data']>()
      .toMatchTypeOf<IReactive<{ id: string; name: string; age: number }[]>['value']>();

    type QIds = LQueryIdsInstance<typeof userSchema>;
    expectTypeOf<QIds['data']>()
      .toMatchTypeOf<IReactive<{ id: string; name: string; age: number }[]>['value']>();

    type QSingle = LQuerySingleInstance<typeof userSchema>;
    expectTypeOf<QSingle['data']>()
      .toMatchTypeOf<IReactive<{ id: string; name: string; age: number } | null>['value']>();
  });

  it('should infer data type with select (pick)', () => {
    type QManySelected = LQueryManyInstance<typeof userSchema, { select: { pick: ['name'] } }>;
    expectTypeOf<QManySelected['data']>()
      .toMatchTypeOf<IReactive<{ name: string }[]>['value']>();

    type QSingleSelected = LQuerySingleInstance<typeof userSchema, { pick: ['name'] }>;
    expectTypeOf<QSingleSelected['data']>()
      .toMatchTypeOf<IReactive<{ name: string } | null>['value']>();
  });

  it('should support count only in many and ids status', () => {
    type ManyCountStatus = SelectedStatus<{ count: true }>;
    expectTypeOf<ManyCountStatus['count']>().toMatchTypeOf<() => number>();

    type CheckManyAllowsCount = { count: true } extends ManyStatusSelection ? true : false;
    expectTypeOf<CheckManyAllowsCount>().toEqualTypeOf<true>();

    // @ts-expect-error - count is not allowed in SingleStatusSelection
    type CheckSingleDisallowsCount = { count: true } extends SingleStatusSelection ? true : false;
  });

  it('should support exists and error on all three forms', () => {
    type StatusBoth = SelectedStatus<{ exists: true; error: true }>;
    expectTypeOf<StatusBoth['exists']>().toMatchTypeOf<() => boolean>();
    expectTypeOf<StatusBoth['error']>().toMatchTypeOf<() => LError | null>();

    type CheckManyStatus = { exists: true; error: true } extends ManyStatusSelection ? true : false;
    expectTypeOf<CheckManyStatus>().toEqualTypeOf<true>();

    type CheckSingleStatus = { exists: true; error: true } extends SingleStatusSelection ? true : false;
    expectTypeOf<CheckSingleStatus>().toEqualTypeOf<true>();
  });

  it('should verify destroy does not exist on query instances', () => {
    type QMany = LQueryManyInstance<typeof userSchema>;
    // @ts-expect-error - destroy does not exist
    type ManyDestroy = QMany['destroy'];

    type QIds = LQueryIdsInstance<typeof userSchema>;
    // @ts-expect-error - destroy does not exist
    type IdsDestroy = QIds['destroy'];

    type QSingle = LQuerySingleInstance<typeof userSchema>;
    // @ts-expect-error - destroy does not exist
    type SingleDestroy = QSingle['destroy'];
  });

  it('should reference lQuery symbol for compiler usage check', () => {
    expectTypeOf(lQuery).toBeFunction();
  });
});
