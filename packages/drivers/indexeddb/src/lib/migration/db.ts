// idb/listeddb.ts
import { openDB, type IDBPDatabase } from 'idb';
import { SchemaSerializer } from './serializer';
import { MigrationDiffer } from './differ';
import { MigrationExecutor } from './executor';
import { IDBSnapshotStore, SNAPSHOT_STORE } from './snapshot-store';
import type { MigrationPlan } from './types';
import { GlobalRegistryOutput } from '@listedbase/core';

const DEFAULT_DB_NAME = 'listedbase';

export class Database  {
  public db!: IDBPDatabase<any>;
  name: string;

  constructor(name?: string) {
    this.name = name ?? DEFAULT_DB_NAME;
  }

  async openDB(registryOutput: GlobalRegistryOutput): Promise<void> {
    const nextSnapshot = SchemaSerializer.serialize(registryOutput);
    const oldSnapshot  = await IDBSnapshotStore.read(this.name);
    const plan         = MigrationDiffer.diff(oldSnapshot, nextSnapshot);
  
    const hasStructural = plan.ops.some(
      (o) =>
        o.op === 'CREATE_STORE'  ||
        o.op === 'DELETE_STORE'  ||
        o.op === 'CREATE_INDEX'  ||
        o.op === 'DELETE_INDEX'  ||
        o.op === 'RECREATE_INDEX',
    );
  
    // ── هل الـ SNAPSHOT_STORE موجود — مستقل عن الـ schema changes ──
    const snapshotStoreMissing = !(await this.storeExists(this.name, SNAPSHOT_STORE));
  
    const needsUpgrade  = hasStructural || snapshotStoreMissing;
    const targetVersion = needsUpgrade
      ? plan.toVersion
      : plan.fromVersion || 1;
  
    // ── لو الـ DB مفتوحة ومفيش upgrade مطلوب ───────────────────
    if (!needsUpgrade && this.db) {
      console.log('[ListedBase] No schema changes — database is ready.');
      return;
    }
  
    this.db = await openDB(this.name, targetVersion, {
  
      upgrade: (db, oldVersion, newVersion, tx) => {
        // دايماً — حتى لو السبب هو snapshotStoreMissing فقط
        IDBSnapshotStore.ensureStore(db);
  
        if (hasStructural) {
          this.log(plan);
          MigrationExecutor.applyStructural(db, tx, plan);
        }
      },
  
      blocked: (currentVersion, blockedVersion) => {
        console.warn(
          `[ListedBase] Upgrade blocked — close other tabs. ` +
          `(current: v${currentVersion}, blocked: v${blockedVersion})`,
        );
      },
  
      blocking: (_currentVersion, _blockedVersion) => {
        this.db?.close();
      },
  
      terminated: () => {
        console.error('[ListedBase] DB connection terminated unexpectedly.');
      },
    });
  
    // data migrations
    if (plan.requiresDataMigration) {
      await MigrationExecutor.applyDataMigrations(this.db, plan);
    }
  
    // الآن الـ SNAPSHOT_STORE مضمون موجود
    nextSnapshot.version = targetVersion;
    await IDBSnapshotStore.write(this.db, nextSnapshot);
  
    if (hasStructural) {
      console.log(`[ListedBase] ✓ Migrated to v${targetVersion}`);
    } else {
      console.log('[ListedBase] ✓ Database is ready.');
    }
  }

  // ── لو الـ DB مش موجودة أصلاً، نرجع false بدون إنشائها ──────
  private async storeExists(dbName: string, storeName: string): Promise<boolean> {
    return new Promise((resolve) => {
      const req = indexedDB.open(dbName);

      req.onupgradeneeded = () => {
        // DB مش موجودة — أغلق فوراً بدون تعديل
        req.transaction?.abort();
        resolve(false);
      };

      req.onsuccess = () => {
        const db     = req.result;
        const exists = db.objectStoreNames.contains(storeName);
        db.close();
        resolve(exists); 
      };

      req.onerror = () => resolve(false);
    });
  }

  private log(plan: MigrationPlan): void {
    console.group(
      `[ListedBase IDB] Upgrading v${plan.fromVersion} → v${plan.toVersion}`,
    );
    plan.description.forEach((line) => console.log(line));
    console.groupEnd();
  }
}