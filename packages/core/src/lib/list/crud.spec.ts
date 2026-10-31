import { describe, it, expect, beforeEach } from 'vitest';
import { list } from './list';
import { lSchema } from '../schema/schema';
import { lField } from '../schema/field';
import { lQuery } from '../query/query';
import { lSetting } from '../setting';
import { LDataDriver, LDriverCapabilities, clearSourcesForTesting } from '@listedbase/driver-abstract';
import { LError } from '../error';

class FallbackDriver extends LDataDriver {
  readonly capabilities: LDriverCapabilities = {
    schema: true,
    cursors: false,
    fullTextSearch: false,
    population: false,
    timestampGeneration: false,
    updatedAt: false,
    subscription: false,
    nativeConstraints: false,
    transactions: true,
    idGeneration: false,
    returning: false,
    batch: false,
    upsert: false,
  };

  store = new Map<string, any>();

  protected override async _init(): Promise<void> {}

  protected override async _create(_listName: string, input: any): Promise<any> {
    if (this.store.has(input.id)) {
      throw new Error('Duplicate key');
    }
    this.store.set(input.id, input);
    return null; // returning: false
  }

  protected override async _update(_listName: string, where: any, input: any): Promise<any> {
    const id = typeof where === 'object' ? where.id : where;
    if (!this.store.has(id)) return null;
    const existing = this.store.get(id);
    const updated = { ...existing, ...input };
    this.store.set(id, updated);
    return null; // returning: false
  }

  protected override async _delete(_listName: string, where: any): Promise<any> {
    const id = typeof where === 'object' ? where.id : where;
    if (!this.store.has(id)) return null;
    this.store.delete(id);
    return true;
  }

  protected override async _findUnique(_listName: string, where: any): Promise<any> {
    const id = typeof where === 'object' ? where.id : where;
    return this.store.get(id) || null;
  }
}

class NativeDriver extends LDataDriver {
  readonly capabilities: LDriverCapabilities = {
    schema: true,
    cursors: true,
    fullTextSearch: false,
    population: false,
    timestampGeneration: true,
    updatedAt: true,
    subscription: false,
    nativeConstraints: true,
    transactions: true,
    idGeneration: true,
    returning: true,
    batch: true,
    upsert: true,
  };

  store = new Map<string, any>();
  autoIdSeq = 100;

  protected override async _init(): Promise<void> {}

  protected override async _create(_listName: string, input: any): Promise<any> {
    const id = input.id || `native-id-${++this.autoIdSeq}`;
    const record = {
      ...input,
      id,
      createdAt: input.createdAt || '2026-01-01T00:00:00.000Z',
    };
    this.store.set(id, record);
    return record; // returning: true
  }

  protected override async _update(_listName: string, where: any, input: any): Promise<any> {
    const id = typeof where === 'object' ? where.id : where;
    const existing = this.store.get(id) || {};
    const updated = {
      ...existing,
      ...input,
      updatedAt: '2026-01-02T00:00:00.000Z',
    };
    this.store.set(id, updated);
    return updated; // returning: true
  }

  protected override async _delete(_listName: string, where: any): Promise<any> {
    const id = typeof where === 'object' ? where.id : where;
    this.store.delete(id);
    return true;
  }

  protected override async _findUnique(_listName: string, where: any): Promise<any> {
    const id = typeof where === 'object' ? where.id : where;
    return this.store.get(id) || null;
  }
}

const userSchema = lSchema({
  name: 'User',
  fields: {
    id: lField.id.autouuid(),
    name: lField.string(),
    createdAt: lField.date().optional(),
    updatedAt: lField.date().optional(),
  },
});

describe('list CRUD runtime tests (Native vs Fallback)', () => {
  beforeEach(() => {
    clearSourcesForTesting();
    let currentVal: any;
    lSetting.reactive(() => ({
      init(val: any) { currentVal = val; },
      modify(fn: any) { currentVal = fn(currentVal); },
      get value() { return currentVal; },
    } as any));
  });

  it('should test Fallback mode when capabilities are false', async () => {
    const fallbackDriver = new FallbackDriver();
    lSetting.sources({
      primary: {
        data: fallbackDriver,
      },
    });

    const q = lQuery(userSchema, {});
    const users = list(q);

    // Create fallback: Core generates id and createdAt
    const created = (await users.create({ name: 'Fallback User' } as any)) as any;
    expect(created.id).toBeDefined();
    expect(typeof created.id).toBe('string');
    expect(created.createdAt).toBeDefined();

    // Update fallback: Core executes findUnique and formats diff
    const updated = (await users.update({
      where: { id: created.id },
      input: { name: 'Updated Fallback' },
    } as any)) as any;
    expect(updated.name).toBe('Updated Fallback');

    // Delete default confirm
    const deleted = await users.delete({ id: created.id } as any);
    expect(deleted).toBe(true);
  });

  it('should test Native mode when capabilities are true', async () => {
    const nativeDriver = new NativeDriver();
    lSetting.sources({
      primary: {
        data: nativeDriver,
      },
    });

    const q = lQuery(userSchema, {});
    const users = list(q);

    // Create native: Driver generates id and timestamps and returns record
    const created = (await users.create({ name: 'Native User' } as any, { intent: 'entity' } as any)) as any;
    expect(created.id).toContain('native-id-');
    expect(created.createdAt.toISOString()).toBe('2026-01-01T00:00:00.000Z');

    // Update native: Driver supplies returning and native updatedAt
    const updated = (await users.update(
      {
        where: { id: created.id },
        input: { name: 'Updated Native' },
      } as any,
      { intent: 'entity' } as any
    )) as any;
    expect(updated.name).toBe('Updated Native');
    expect(updated.updatedAt.toISOString()).toBe('2026-01-02T00:00:00.000Z');
  });

  it('should support select with omit and pick', async () => {
    const fallbackDriver = new FallbackDriver();
    lSetting.sources({
      primary: {
        data: fallbackDriver,
      },
    });

    const q = lQuery(userSchema, {});
    const users = list(q);

    const created = (await users.create(
      { name: 'Charlie' } as any,
      { intent: 'entity', select: { omit: ['createdAt'] } } as any
    )) as any;
    expect(created.name).toBe('Charlie');
    expect(created.createdAt).toBeUndefined();
  });

  it('should convert validation errors to VALIDATION/FIELD LError', async () => {
    const fallbackDriver = new FallbackDriver();
    lSetting.sources({
      primary: {
        data: fallbackDriver,
      },
    });

    const q = lQuery(userSchema, {});
    const users = list(q);

    try {
      await users.create({ name: 123 as any } as any);
      expect.unreachable();
    } catch (err: any) {
      expect(err).toBeInstanceOf(LError);
      expect(err.code).toBe('VALIDATION/FIELD');
      expect(err.field).toBe('name');
    }
  });

  it('should support settled errorMode for array mutations', async () => {
    const fallbackDriver = new FallbackDriver();
    lSetting.sources({
      primary: {
        data: fallbackDriver,
      },
    });

    const q = lQuery(userSchema, {});
    const users = list(q);

    const settledResults = (await users.create(
      [{ name: 'David' }, { name: 999 as any }] as any,
      { errorMode: 'settled' }
    )) as any[];

    expect(settledResults[0].status).toBe('fulfilled');
    expect(settledResults[1].status).toBe('rejected');
    expect(settledResults[1].error.code).toBe('VALIDATION/FIELD');
  });
});
