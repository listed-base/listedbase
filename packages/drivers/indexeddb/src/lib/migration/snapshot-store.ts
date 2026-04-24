// idb/migration/snapshot-store.ts
import { type IDBPDatabase } from 'idb';
import type { IDBDatabaseSnapshot } from './types';

export const SNAPSHOT_STORE = '__lb_schema__';
const SNAPSHOT_KEY          = 'snapshot';

export class IDBSnapshotStore {

  static ensureStore(db: IDBPDatabase<any>): void {
    if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
      db.createObjectStore(SNAPSHOT_STORE);
    }
  }

  // raw IDB — بدون version، بدون إنشاء DB جديدة
  static read(dbName: string): Promise<IDBDatabaseSnapshot | null> {
    return new Promise((resolve) => {
      const req = indexedDB.open(dbName); // بدون version

      req.onupgradeneeded = () => {
        // DB مش موجودة أصلاً — abort بدون إنشاء أي شيء
        req.transaction!.abort();
      };

      req.onsuccess = () => {
        const db = req.result;

        if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
          db.close();
          resolve(null);
          return;
        }

        const tx      = db.transaction(SNAPSHOT_STORE, 'readonly');
        const store   = tx.objectStore(SNAPSHOT_STORE);
        const getReq  = store.get(SNAPSHOT_KEY);

        getReq.onsuccess = () => {
          db.close();
          resolve((getReq.result as IDBDatabaseSnapshot) ?? null);
        };

        getReq.onerror = () => {
          db.close();
          resolve(null);
        };
      };

      req.onerror = () => resolve(null);

      // abort يطلق onerror — نتجاهله
      req.onblocked = () => resolve(null);
    });
  }

  static async write(
    db:       IDBPDatabase<any>,
    snapshot: IDBDatabaseSnapshot,
  ): Promise<void> {
    if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
      throw new Error(
        `[ListedBase] "${SNAPSHOT_STORE}" store not found. ` +
        `Ensure ensureStore() was called inside the upgrade callback.`,
      );
    }
    await db.put(SNAPSHOT_STORE, snapshot, SNAPSHOT_KEY);
  }
}