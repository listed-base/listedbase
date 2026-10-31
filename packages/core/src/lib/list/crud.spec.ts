import { describe, it, expect, beforeEach } from 'vitest';
import { list, LCodec } from './list';
import { createCodec } from './codec';
import { lSchema } from '../schema/schema';
import { lField } from '../schema/field';
import { lQuery } from '../query/query';
import { lSetting } from '../setting';
import { LDataDriver, LDriverCapabilities, clearSourcesForTesting } from '@listedbase/driver-abstract';
import { LError } from '../error';

class MockDriver extends LDataDriver {
  readonly capabilities: LDriverCapabilities = {
    schema: true,
    cursors: true,
    fullTextSearch: false,
    population: false,
    timestampGeneration: false,
    updatedAt: false,
    subscription: false,
    nativeConstraints: false,
    transactions: true,
  };

  store = new Map<string, any>();

  protected override async _init(): Promise<void> {}

  protected override async _create(_listName: string, input: any): Promise<any> {
    if (this.store.has(input.id)) {
      throw new Error('Duplicate key');
    }
    this.store.set(input.id, input);
    return input;
  }

  protected override async _update(_listName: string, where: any, input: any): Promise<any> {
    const id = typeof where === 'object' ? where.id : where;
    if (!this.store.has(id)) return null;
    const existing = this.store.get(id);
    const updated = { ...existing, ...input };
    this.store.set(id, updated);
    return updated;
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

const userSchema = lSchema({
  name: 'User',
  fields: {
    id: lField.id.autouuid(),
    name: lField.string(),
    createdAt: lField.date().optional(),
    updatedAt: lField.date().optional(),
  },
});

describe('list CRUD runtime tests', () => {
  beforeEach(() => {
    clearSourcesForTesting();
    let currentVal: any;
    lSetting.reactive(() => ({
      init(val: any) { currentVal = val; },
      modify(fn: any) { currentVal = fn(currentVal); },
      get value() { return currentVal; },
    } as any));

    const mockDriver = new MockDriver();
    lSetting.sources({
      primary: {
        data: mockDriver,
      },
    });
  });

  it('should test LCodec and createCodec encoding and decoding', () => {
    const date = new Date();
    const encoded = LCodec.encode({ date });
    expect(typeof encoded.date).toBe('string');

    const decoded = LCodec.decode(encoded);
    expect(decoded.date).toBeInstanceOf(Date);

    const schemaCodec = createCodec(userSchema);
    const schemaEncoded = schemaCodec.encode({ createdAt: date, name: 'Test' });
    expect(typeof schemaEncoded.createdAt).toBe('string');
    const schemaDecoded = schemaCodec.decode(schemaEncoded);
    expect(schemaDecoded.createdAt).toBeInstanceOf(Date);
  });

  it('should execute single create, update, and delete with proper defaults', async () => {
    const q = lQuery(userSchema, {});
    const users = list(q);

    // Create returns { id, createdAt } by default
    const created = (await users.create({ name: 'Bob' } as any)) as any;
    expect(created.id).toBeDefined();
    expect(created.createdAt).toBeDefined();

    // Create with 'entity' returns full entity
    const createdEntity = (await users.create({ name: 'Alice' } as any, { intent: 'entity' } as any)) as any;
    expect(createdEntity.name).toBe('Alice');
    expect(createdEntity.id).toBeDefined();

    // Update default returns changed fields
    const updated = (await users.update({
      where: { id: createdEntity.id },
      input: { name: 'Alicia' },
    } as any)) as any;
    expect(updated.name).toBe('Alicia');

    // Delete default returns boolean
    const deletedConfirm = await users.delete({ id: createdEntity.id } as any);
    expect(deletedConfirm).toBe(true);
  });

  it('should support select with omit and pick', async () => {
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
