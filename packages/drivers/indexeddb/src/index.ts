import { LDriver } from '@listedbase/driver-abstract';
import { Database } from './lib/migration/db';
import { GlobalRegistryOutput } from '@listedbase/core';

class LIndexeddb extends LDriver {
  database: Database;
  constructor(name?: string) {
    super();
    this.database = new Database(name);
  }
  protected override _init(schemas: GlobalRegistryOutput): Promise<void> {
    return this.database.openDB(schemas);
  }
  public override async create(list: string, input: any): Promise<any> {
    const data = await this.database.db.add(list, input);
    return data;
  }
}
export function lIndexeddb(name?: string): LDriver {
  return new LIndexeddb(name);
}
