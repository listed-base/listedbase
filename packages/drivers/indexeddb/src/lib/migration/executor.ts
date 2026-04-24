// idb/migration/executor.ts
import type { IDBPDatabase, IDBPTransaction } from 'idb';
import type { MigrationPlan, MigrationOp } from './types';

type UpgradeTx = IDBPTransaction<any, string[], 'versionchange'>;

export class MigrationExecutor {
  // ── Phase 1: داخل upgrade callback ─────────────────────────
  // idb يعطيك IDBPDatabase و IDBPTransaction مباشرة — لا raw IDB
  static applyStructural(
    db: IDBPDatabase<any>,
    tx: UpgradeTx,
    plan: MigrationPlan,
  ): void {
    for (const op of plan.ops) {
      switch (op.op) {
        case 'CREATE_STORE': {
          if (!db.objectStoreNames.contains(op.store)) {
            // idb: db.createObjectStore — نفس IDB API لكن typed
            db.createObjectStore(op.store, {
              keyPath: op.keyPath,
              autoIncrement: op.autoIncrement,
            });
          }
          break;
        }

        case 'DELETE_STORE': {
          if (db.objectStoreNames.contains(op.store)) {
            db.deleteObjectStore(op.store);
          }
          break;
        }

        case 'CREATE_INDEX': {
          // idb: tx.objectStore — يرجع IDBPObjectStore
          const store = tx.objectStore(op.store);
          if (!store.indexNames.contains(op.index.name)) {
            store.createIndex(op.index.name, op.index.keyPath, {
              unique: op.index.unique,
              multiEntry: op.index.multiEntry,
            });
          }
          break;
        }

        case 'DELETE_INDEX': {
          const store = tx.objectStore(op.store);
          if (store.indexNames.contains(op.indexName)) {
            store.deleteIndex(op.indexName);
          }
          break;
        }

        case 'RECREATE_INDEX': {
          const store = tx.objectStore(op.store);
          // احذف أولاً لو موجود
          if (store.indexNames.contains(op.index.name)) {
            store.deleteIndex(op.index.name);
          }
          store.createIndex(op.index.name, op.index.keyPath, {
            unique: op.index.unique,
            multiEntry: op.index.multiEntry,
          });
          break;
        }
      }
    }
  }

  // ── Phase 2: بعد فتح الـ DB — data migrations ──────────────
  // هنا idb يفرق كثيراً — كل شيء async/await بدون callbacks
  static async applyDataMigrations(
    db: IDBPDatabase<any>,
    plan: MigrationPlan,
  ): Promise<void> {
    if (!plan.requiresDataMigration) return;

    const dataOps = plan.ops.filter(
      (
        op,
      ): op is Extract<
        MigrationOp,
        | { op: 'ADD_FIELD_DEFAULT' }
        | { op: 'RENAME_FIELD' }
        | { op: 'DROP_FIELD_DATA' }
      > =>
        op.op === 'ADD_FIELD_DEFAULT' ||
        op.op === 'RENAME_FIELD' ||
        op.op === 'DROP_FIELD_DATA',
    );

    for (const op of dataOps) {
      switch (op.op) {
        case 'ADD_FIELD_DEFAULT':
          await this.backfillField(db, op.store, op.field, op.defaultValue);
          break;
        case 'RENAME_FIELD':
          await this.renameField(db, op.store, op.from, op.to);
          break;
        case 'DROP_FIELD_DATA':
          await this.dropFieldData(db, op.store, op.field);
          break;
      }
    }
  }

  // idb: async iterator على الـ cursor — لا onsuccess callbacks
  private static async backfillField(
    db: IDBPDatabase<any>,
    storeName: string,
    field: string,
    defaultValue: unknown,
  ): Promise<void> {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    // idb async iterator — أنظف بكثير من raw cursor
    for await (const cursor of store) {
      const record = cursor.value;
      if (record[field] === undefined || record[field] === null) {
        record[field] = defaultValue;
        await cursor.update(record);
      }
    }

    await tx.done; // idb: promise يكتمل عند انتهاء الـ transaction
  }

  private static async renameField(
    db: IDBPDatabase<any>,
    storeName: string,
    from: string,
    to: string,
  ): Promise<void> {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    for await (const cursor of store) {
      const record = cursor.value;
      if (from in record) {
        record[to] = record[from];
        delete record[from];
        await cursor.update(record);
      }
    }

    await tx.done;
  }

  private static async dropFieldData(
    db: IDBPDatabase<any>,
    storeName: string,
    field: string,
  ): Promise<void> {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    for await (const cursor of store) {
      const record = cursor.value;
      if (field in record) {
        delete record[field];
        await cursor.update(record);
      }
    }

    await tx.done;
  }
}
