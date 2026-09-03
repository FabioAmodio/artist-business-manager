import { Injectable, inject } from '@angular/core';
import { AppDatabase, DATABASE_VERSION } from '../persistence/app-database';
import { APP_ENVIRONMENT } from '../configuration/environment.tokens';
import type { EntityId } from '../../domain/shared/types';
import type {
  DeleteMetadata,
  IStorageProvider,
  StorageFilter,
  StorageHealth,
} from './storage-provider';
import { SyncStatusService } from '../synchronization/sync-status.service';
import type { SyncOperation } from '../../domain/models/sync-operation';

@Injectable()
export class IndexedDbProvider implements IStorageProvider {
  private readonly environment = inject(APP_ENVIRONMENT);
  private readonly syncStatus = inject(SyncStatusService);
  private readonly databaseName = `${this.environment.storagePrefix}-${this.environment.applicationName}`;
  private database: AppDatabase | null = null;

  async open(): Promise<void> {
    this.database = new AppDatabase(this.databaseName);
    await this.database.openDatabase();
  }

  async close(): Promise<void> {
    this.database?.close();
    this.database = null;
  }

  async get<T>(_collection: string, _id: EntityId): Promise<T | null> {
    if (!this.database || !this.isSupportedCollection(_collection)) return null;
    const table = this.database.table(_collection);
    return (await table.get(_id) as T | undefined) ?? null;
  }

  async list<T>(_collection: string, _filter?: StorageFilter): Promise<readonly T[]> {
    if (!this.database || !this.isSupportedCollection(_collection)) return [];
    return await this.database.table(_collection).toArray() as T[];
  }

  async put<T>(_collection: string, _value: T): Promise<void> {
    if (this.database && this.isSupportedCollection(_collection)) {
      const previous = _collection === 'appSettings' || _collection === 'syncOperations' ? undefined : await this.database.table(_collection).get((_value as { id: EntityId }).id) as Record<string, unknown> | undefined;
      if (_collection !== 'appSettings' && _collection !== 'syncOperations') {
        const table = this.database.table(_collection);
        const queue = this.database.table('syncOperations');
        await this.database.transaction('rw', [table, queue], async () => {
          await table.put(_value);
          await this.recordSyncOperation(_collection, _value as Record<string, unknown>, previous);
        });
        this.syncStatus.notifyLocalChange();
      } else {
        await this.database.table(_collection).put(_value);
      }
    }
  }

  async deleteLogical(_collection: string, _id: EntityId, _metadata?: DeleteMetadata): Promise<void> {
    if (!this.database || !this.isSupportedCollection(_collection)) return;
    const table = this.database.table(_collection);
    const value = await table.get(_id) as (DeleteMetadata & { readonly id: EntityId }) | undefined;
    if (value) {
      if (_collection !== 'appSettings' && _collection !== 'syncOperations') {
        const next = { ...value, deletedAt: _metadata?.deletedAt ?? new Date().toISOString() };
        const queue = this.database.table('syncOperations');
        await this.database.transaction('rw', [table, queue], async () => {
          await table.put(next);
          await this.recordSyncOperation(_collection, next, value);
        });
        this.syncStatus.notifyLocalChange();
      } else {
        await table.put({ ...value, deletedAt: _metadata?.deletedAt ?? new Date().toISOString() });
      }
    }
  }

  async deletePermanent(collection: string, id: EntityId): Promise<void> {
    if (this.database && this.isSupportedCollection(collection)) await this.database.table(collection).delete(id);
  }

  async clearCollections(collections: readonly string[]): Promise<void> {
    if (!this.database) return;
    const supported = collections.filter((collection) => this.isSupportedCollection(collection));
    const tables = supported.map((collection) => this.database!.table(collection));
    await this.database.transaction('rw', tables, async () => {
      await Promise.all(tables.map((table) => table.clear()));
    });
    if (supported.some((collection) => collection !== 'appSettings')) this.syncStatus.notifyLocalChange();
  }

  async transaction<T>(_collections: readonly string[], work: () => Promise<T>): Promise<T> {
    return work();
  }

  async health(): Promise<StorageHealth> {
    return {
      available: this.database !== null,
      provider: 'IndexedDbProvider',
      databaseName: this.databaseName,
      schemaVersion: DATABASE_VERSION,
      migrationVersion: 0,
      checkedAt: new Date().toISOString(),
    };
  }

  private isSupportedCollection(collection: string): boolean {
    return collection === 'appSettings' || collection === 'bundles' || collection === 'fairs' || collection === 'fairSeries' || collection === 'fairEditions' || collection === 'lots' || collection === 'parties' || collection === 'operations' || collection === 'paymentMethods' || collection === 'payments' || collection === 'products' || collection === 'purchases' || collection === 'services' || collection === 'syncOperations';
  }

  private async recordSyncOperation(collection: string, after: Record<string, unknown>, before?: Record<string, unknown>): Promise<void> {
    if (!this.database || this.syncStatus.isSuppressed()) return;
    const now = new Date().toISOString();
    const operation: SyncOperation = {
      id: crypto.randomUUID(), deviceId: this.deviceId(), collection, entityId: String(after['id']),
      action: after['deletedAt'] ? 'delete' : before ? 'update' : 'create', before, after,
      status: 'pending', createdAt: now, updatedAt: now, retryCount: 0,
    };
    await this.database.table('syncOperations').add(operation);
  }

  private deviceId(): string {
    const key = 'abm-device-id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
    return id;
  }
}
