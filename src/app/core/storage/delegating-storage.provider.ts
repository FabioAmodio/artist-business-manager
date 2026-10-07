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

// Locale-first: tutte le collection applicative restano sempre su IndexedDB, qualunque sia la modalita di persistenza.
// La sincronizzazione con Firestore e un processo separato (PersistenceService.synchronize), non instradamento diretto delle letture/scritture.
@Injectable()
export class DelegatingStorageProvider implements IStorageProvider {
  private readonly offline = inject(IndexedDbProvider);
  private mode: PersistenceMode = 'offline';

  // Conservato per compatibilita con IStorageProvider/PersistenceService: non influenza piu l'instradamento.
  setMode(mode: PersistenceMode): void { this.mode = mode; }

  async open(): Promise<void> {
    await this.offline.open();
  }

  async close(): Promise<void> {
    await this.offline.close();
  }

  get<T>(collection: string, id: EntityId): Promise<T | null> {
    return this.offline.get(collection, id);
  }

  list<T>(collection: string, filter?: StorageFilter): Promise<readonly T[]> {
    return this.offline.list(collection, filter);
  }

  put<T>(collection: string, value: T): Promise<void> {
    return this.offline.put(collection, value);
  }

  deleteLogical(collection: string, id: EntityId, metadata?: DeleteMetadata): Promise<void> {
    return this.offline.deleteLogical(collection, id, metadata);
  }

  deletePermanent(collection: string, id: EntityId): Promise<void> {
    return this.offline.deletePermanent(collection, id);
  }

  clearCollections(collections: readonly string[]): Promise<void> {
    return this.offline.clearCollections(collections);
  }

  transaction<T>(collections: readonly string[], work: () => Promise<T>): Promise<T> {
    return this.offline.transaction(collections, work);
  }

  health(): Promise<StorageHealth> {
    return this.offline.health();
  }
}
