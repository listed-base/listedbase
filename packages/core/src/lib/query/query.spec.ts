import { describe, it, expect, beforeEach } from 'vitest';
import { list } from '../list/list';
import { lSchema } from '../schema/schema';
import { lField } from '../schema/field';
import { lQuery } from './query';
import { lSetting } from '../setting';
import {
  LDataDriver,
  LDriverCapabilities,
  FindManyOptions,
  FindManyResult,
  clearSourcesForTesting,
} from '@listedbase/driver-abstract';

class MemoryDataDriver extends LDataDriver {
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
    idGeneration: false,
    returning: true,
    batch: false,
    upsert: false,
  };

  store = new Map<string, any>();

  protected override async _init(): Promise<void> {}

  protected override async _create(_listName: string, input: any): Promise<any> {
    this.store.set(String(input.id), input);
    return input;
  }

  protected override async _update(_listName: string, where: any, input: any): Promise<any> {
    const id = typeof where === 'object' ? where.id : where;
    const existing = this.store.get(String(id));
    if (!existing) return null;
    const updated = { ...existing, ...input };
    this.store.set(String(id), updated);
    return updated;
  }

  protected override async _delete(_listName: string, where: any): Promise<any> {
    const id = typeof where === 'object' ? where.id : where;
    this.store.delete(String(id));
    return true;
  }

  protected override async _findUnique(_listName: string, where: any): Promise<any> {
    const id = typeof where === 'object' ? where.id : where;
    return this.store.get(String(id)) || null;
  }

  protected override async _findMany(_listName: string, options: FindManyOptions): Promise<FindManyResult> {
    let all = Array.from(this.store.values());

    if (options.where?.id?.in) {
      const allowed = new Set(options.where.id.in.map(String));
      all = all.filter((item) => allowed.has(String(item.id)));
    } else if (options.where?.title) {
      all = all.filter((item) => item.title === options.where.title);
    }

    let startIndex = 0;
    if (options.cursor) {
      const cursorId = atob(options.cursor);
      const idx = all.findIndex((it) => String(it.id) === cursorId);
      if (idx !== -1) startIndex = idx + 1;
    }

    const items = options.take ? all.slice(startIndex, startIndex + options.take) : all.slice(startIndex);
    let nextCursor: string | null = null;
    if (options.take && startIndex + options.take < all.length) {
      const last = items[items.length - 1];
      if (last) nextCursor = btoa(String(last.id));
    }

    return { items, nextCursor };
  }

  protected override async _count(_listName: string, _where?: any): Promise<number> {
    return this.store.size;
  }
}

const postSchema = lSchema({
  name: 'Post',
  fields: {
    id: lField.id.autouuid(),
    title: lField.string(),
  },
});

describe('lQuery reactive runtime tests', () => {
  beforeEach(() => {
    clearSourcesForTesting();
    lSetting.reactive(() => {
      let val: any;
      return {
        init(initVal: any) { val = initVal; },
        modify(fn: any) { val = fn(val); },
        get value() { return () => val; },
      } as any;
    });

    const driver = new MemoryDataDriver();
    lSetting.sources({
      primary: {
        data: driver,
      },
    });
  });

  it('should test many query with initial load and modify', async () => {
    const posts = list(postSchema);
    await posts.create({ title: 'First Post' } as any);
    await posts.create({ title: 'Second Post' } as any);

    const q = lQuery(posts, { take: 10 });
    // Allow initial async fetch
    await new Promise((r) => setTimeout(r, 50));

    expect(q.data().length).toBe(2);
    expect(q.value().take).toBe(10);

    q.modify((prev) => ({ ...prev, where: { title: 'First Post' } }));
    await new Promise((r) => setTimeout(r, 50));

    expect(q.data().length).toBe(1);
    expect(q.data()[0].title).toBe('First Post');
    q.destroy();
  });

  it('should reactively update when mutations occur in the list', async () => {
    const posts = list(postSchema);
    const q = lQuery(posts, {});
    await new Promise((r) => setTimeout(r, 50));
    expect(q.data().length).toBe(0);

    await posts.create({ title: 'Added reactively' } as any);
    // Allow microtask and async re-fetch
    await new Promise((r) => setTimeout(r, 50));

    expect(q.data().length).toBe(1);
    expect(q.data()[0].title).toBe('Added reactively');
    q.destroy();
  });

  it('should support pagination with hasNext and loadNext', async () => {
    const posts = list(postSchema);
    await posts.create({ title: 'P1' } as any);
    await posts.create({ title: 'P2' } as any);
    await posts.create({ title: 'P3' } as any);

    const q = lQuery(posts, { take: 2 });
    await new Promise((r) => setTimeout(r, 50));

    expect(q.data().length).toBe(2);
    expect(q.hasNext()).toBe(true);

    await q.loadNext();
    expect(q.data().length).toBe(3);
    expect(q.hasNext()).toBe(false);
    q.destroy();
  });

  it('should support ids query form and reorder items', async () => {
    const posts = list(postSchema);
    const c1 = (await posts.create({ title: 'Item 1' } as any)) as any;
    const c2 = (await posts.create({ title: 'Item 2' } as any)) as any;

    // Ask in reverse order
    const q = lQuery(posts, [c2.id, c1.id, 'non-existent']);
    await new Promise((r) => setTimeout(r, 50));

    const data = q.data();
    expect(data.length).toBe(2);
    expect(data[0].id).toBe(c2.id);
    expect(data[1].id).toBe(c1.id);
    q.destroy();
  });

  it('should support single query form', async () => {
    const posts = list(postSchema);
    const c1 = (await posts.create({ title: 'Single Item' } as any)) as any;

    const q = lQuery.single(posts, { where: { id: c1.id } });
    await new Promise((r) => setTimeout(r, 50));

    expect(q.data()?.title).toBe('Single Item');
    q.destroy();
  });

  it('should support status selections for count and error', async () => {
    const posts = list(postSchema);
    await posts.create({ title: 'Test Count' } as any);

    const q = lQuery(posts, { take: 1 });
    const status = q.status({ count: true, error: true });
    await new Promise((r) => setTimeout(r, 50));

    expect(status.count()).toBe(1);
    expect(status.error()).toBeNull();
    q.destroy();
  });
});
