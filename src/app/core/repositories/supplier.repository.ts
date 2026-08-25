import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Party } from '../../domain/models/party';
import type { ISupplierRepository } from '../../domain/repositories/supplier.repository';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'parties';

@Injectable({ providedIn: 'root' })
export class SupplierRepository implements ISupplierRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<Party | null> {
    const party = await this.storage.get<Party>(COLLECTION, id);
    return party?.deletedAt || !party?.roles?.includes('supplier') ? null : party;
  }

  async search(query: string, limit = 20): Promise<readonly Party[]> {
    const normalized = query.trim().toLowerCase();
    const parties = await this.storage.list<Party>(COLLECTION);
    return parties
      .filter((party) => !party.deletedAt && party.roles?.includes('supplier'))
      .filter((party) => !normalized || `${party.displayName} ${party.email ?? ''} ${party.phone ?? ''} ${party.website ?? ''} ${party.supplierType ?? ''}`.toLowerCase().includes(normalized))
      .sort((first, second) => first.displayName.localeCompare(second.displayName))
      .slice(0, limit);
  }

  save(supplier: Party): Promise<void> {
    return this.storage.put(COLLECTION, supplier);
  }

  softDelete(id: string): Promise<void> {
    return this.storage.deleteLogical(COLLECTION, id);
  }
}