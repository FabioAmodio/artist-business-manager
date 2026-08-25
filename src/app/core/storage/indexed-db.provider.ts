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

@Injectable()
export class IndexedDbProvider implements IStorageProvider {
  private readonly environment = inject(APP_ENVIRONMENT);
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
    if (this.database && this.isSupportedCollection(_collection)) await this.database.table(_collection).put(_value);
  }

  async deleteLogical(_collection: string, _id: EntityId, _metadata?: DeleteMetadata): Promise<void> {
    if (!this.database || !this.isSupportedCollection(_collection)) return;
    const table = this.database.table(_collection);
    const value = await table.get(_id) as (DeleteMetadata & { readonly id: EntityId }) | undefined;
    if (value) {
      await table.put({
        ...value,
        deletedAt: _metadata?.deletedAt ?? new Date().toISOString(),
      });
    }
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
    return collection === 'fairs' || collection === 'fairSeries' || collection === 'fairEditions' || collection === 'lots' || collection === 'parties' || collection === 'operations' || collection === 'products' || collection === 'purchases';
  }
}
