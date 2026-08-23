import { Injectable, inject } from '@angular/core';
import { AppDatabase, DATABASE_VERSION } from '../persistence/app-database';
import { APP_ENVIRONMENT } from '../configuration/environment.tokens';
import type { EntityId } from '../../domain/shared/types';
import type { Fair } from '../../domain/models/fair';
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
    if (!this.database || _collection !== 'fairs') return null;
    return (await this.database.fairs.get(_id) as Fair | undefined ?? null) as T | null;
  }

  async list<T>(_collection: string, _filter?: StorageFilter): Promise<readonly T[]> {
    if (!this.database || _collection !== 'fairs') return [];
    const fairs = await this.database.fairs.toArray();
    return fairs as T[];
  }

  async put<T>(_collection: string, _value: T): Promise<void> {
    if (this.database && _collection === 'fairs') {
      await this.database.fairs.put(_value as Fair);
    }
  }

  async deleteLogical(_collection: string, _id: EntityId, _metadata?: DeleteMetadata): Promise<void> {
    if (!this.database || _collection !== 'fairs') return;
    const fair = await this.database.fairs.get(_id);
    if (fair) {
      await this.database.fairs.put({
        ...fair,
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
}
