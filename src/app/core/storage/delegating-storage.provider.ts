import { Injectable, inject } from '@angular/core';
import type { EntityId } from '../../domain/shared/types';
import type { PersistenceMode } from '../persistence/persistence.models';
import type {
  DeleteMetadata,
  IStorageProvider,
  StorageFilter,
  StorageHealth,
} from './storage-provider';
import { IndexedDbProvider } from './indexed-db.provider';

const LOCAL_COLLECTIONS = new Set(['appSettings', 'syncOperations']);

@Injectable()
export class DelegatingStorageProvider implements IStorageProvider {
  private readonly offline = inject(IndexedDbProvider);
  private mode: PersistenceMode = 'offline';

  setMode(mode: PersistenceMode): void { this.mode = mode; }

  async open(): Promise<void> {
    await this.offline.open();
  }

  async close(): Promise<void> {
    await this.offline.close();
  }

  get<T>(collection: string, id: EntityId): Promise<T | null> {
    return this.providerFor(collection).get(collection, id);
  }

  list<T>(collection: string, filter?: StorageFilter): Promise<readonly T[]> {
    return this.providerFor(collection).list(collection, filter);
  }

  put<T>(collection: string, value: T): Promise<void> {
    return this.providerFor(collection).put(collection, value);
  }

  deleteLogical(collection: string, id: EntityId, metadata?: DeleteMetadata): Promise<void> {
    return this.providerFor(collection).deleteLogical(collection, id, metadata);
  }

  deletePermanent(collection: string, id: EntityId): Promise<void> {
    return this.providerFor(collection).deletePermanent(collection, id);
  }

  clearCollections(collections: readonly string[]): Promise<void> {
    const local = collections.filter((collection) => LOCAL_COLLECTIONS.has(collection));
    const remote = collections.filter((collection) => !LOCAL_COLLECTIONS.has(collection));
    const tasks: Promise<void>[] = [];
    if (local.length) tasks.push(this.offline.clearCollections(local));
    if (remote.length) tasks.push(this.providerFor(remote[0]).clearCollections(remote));
    return Promise.all(tasks).then(() => undefined);
  }

  transaction<T>(collections: readonly string[], work: () => Promise<T>): Promise<T> {
    return this.providerFor(collections[0] ?? '').transaction(collections, work);
  }

  health(): Promise<StorageHealth> {
    return this.providerFor('appSettings').health();
  }

  private providerFor(collection: string): IStorageProvider {
    return this.offline;
  }
}
