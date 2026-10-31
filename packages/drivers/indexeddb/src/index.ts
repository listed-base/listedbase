import { LDataDriver, LDriverCapabilities } from '@listedbase/driver-abstract';
import { Database } from './lib/migration/db';
import { GlobalRegistryOutput } from '@listedbase/core';

class LIndexeddb extends LDataDriver {
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

  database: Database;

  constructor(name?: string) {
    super();
    this.database = new Database(name);
  }

  protected override _init(schemas: GlobalRegistryOutput): Promise<void> {
    return this.database.openDB(schemas);
  }

  protected override async _create(list: string, input: any): Promise<any> {
    const data = await this.database.db.add(list, input);
    return data;
  }

  protected override async _update(
    list: string,
    where: any,
    input: any
  ): Promise<any> {
    const key = typeof where === 'object' ? where.id || where : where;
    const existing = await this.database.db.get(list, key);
    if (!existing) return null;
    const updated = { ...existing, ...input };
    await this.database.db.put(list, updated);
    return updated;
  }

  protected override async _delete(list: string, where: any): Promise<any> {
    const key = typeof where === 'object' ? where.id || where : where;
    const data = await this.database.db.delete(list, key);
    return data;
  }

  protected override async _findUnique(
    list: string,
    where: any
  ): Promise<any> {
    const key = typeof where === 'object' ? where.id || where : where;
    const data = await this.database.db.get(list, key);
    return data;
  }
}

export function lIndexeddb(name?: string): LDataDriver {
  return new LIndexeddb(name);
}
