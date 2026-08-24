import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Party } from '../../domain/models/party';
import type { IClientRepository } from '../../domain/repositories/client.repository';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'parties';

@Injectable({ providedIn: 'root' })
export class ClientRepository implements IClientRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<Party | null> {
    const party = await this.storage.get<Party>(COLLECTION, id);
    return party?.deletedAt ? null : party;
  }

  async search(query: string, limit = 20): Promise<readonly Party[]> {
    const normalized = query.trim().toLowerCase();
    const parties = await this.storage.list<Party>(COLLECTION);
    return parties
      .filter((party) => !party.deletedAt)
      .filter((party) => !normalized || `${party.displayName} ${party.email ?? ''} ${party.phone ?? ''} ${party.social ?? ''}`.toLowerCase().includes(normalized))
      .sort((first, second) => first.displayName.localeCompare(second.displayName))
      .slice(0, limit);
  }

  save(client: Party): Promise<void> {
    return this.storage.put(COLLECTION, client);
  }

  convertSoftCustomer(_operationId: string, _partyId: string): Promise<void> {
    return Promise.resolve();
  }

  softDelete(id: string): Promise<void> {
    return this.storage.deleteLogical(COLLECTION, id);
  }
}
