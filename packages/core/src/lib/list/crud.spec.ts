import { describe, it, expect } from 'vitest';
import { list, LCodec } from './list';
import { lSchema } from '../schema/schema';
import { lField } from '../schema/field';
import { lQuery } from '../query/query';
import { lSetting } from '../setting';
import { LDataDriver, LDriverCapabilities, clearSourcesForTesting } from '@listedbase/driver-abstract';

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

  protected override async _create(listName: string, input: any): Promise<any> {
    if (this.store.has(input.id)) {
      throw new Error('Duplicate key');
    }
    this.store.set(input.id, input);
    return input;
  }

  protected override async _update(listName: string, where: any, input: any): Promise<any> {
    const id = typeof where === 'object' ? where.id : where;
    if (!this.store.has(id)) return null;
    const existing = this.store.get(id);
    const updated = { ...existing, ...input };
    this.store.set(id, updated);
    return updated;
  }

  protected override async _delete(listName: string, where: any): Promise<any> {
    const id = typeof where === 'object' ? where.id : where;
    if (!this.store.has(id)) return null;
    this.store.delete(id);
    return true;
  }

  protected override async _findUnique(listName: string, where: any): Promise<any> {
    const id = typeof where === 'object' ? where.id : where;
    return this.store.get(id) || null;
  }
}

const userSchema = lSchema('User', {
  id: lField.id.autouuid(),
  name: lField.string(),
});

describe('list CRUD runtime tests', () => {
  it('should test LCodec encoding and decoding', () => {
    const date = new Date();
    const encoded = LCodec.encode({ date });
    expect(typeof encoded.date).toBe('string');

    const decoded = LCodec.decode(encoded);
    expect(decoded.date).toBeInstanceOf(Date);
  });

  it('should execute single create, update, and delete', async () => {
    clearSourcesForTesting();
    const mockDriver = new MockDriver();
    lSetting.sources({
      primary: {
        data: mockDriver,
      },
    });

    const q = lQuery(userSchema, {});
    const users = list(q);

    // Create
    const created = (await users.create({ name: 'Bob' })) as { id: string; name: string };
    expect(created.name).toBe('Bob');
    expect(created.id).toBeDefined();

    // Update
    const updated = (await users.update({
      where: { id: created.id },
      input: { name: 'Bobby' },
    })) as { id: string; name: string };
    expect(updated.name).toBe('Bobby');

    // Delete default (boolean)
    const deletedConfirm = await users.delete({ id: created.id });
    expect(deletedConfirm).toBe(true);
  });
});
