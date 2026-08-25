import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Lot } from '../../domain/models/lot';
import type { ILotRepository } from '../../domain/repositories/lot.repository';
import type { LotFilter } from '../../domain/repositories/repository-types';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'lots';

@Injectable({ providedIn: 'root' })
export class LotRepository implements ILotRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<Lot | null> {
    const lot = await this.storage.get<Lot>(COLLECTION, id);
    return lot?.deletedAt ? null : lot;
  }

  async list(filter?: LotFilter): Promise<readonly Lot[]> {
    const normalized = filter?.text?.trim().toLowerCase() ?? '';
    const lots = await this.storage.list<Lot>(COLLECTION);
    return lots
      .filter((lot) => filter?.includeDeleted || !lot.deletedAt)
      .filter((lot) => !filter?.productId || lot.productId === filter.productId)
      .filter((lot) => !filter?.purchaseId || lot.purchaseId === filter.purchaseId)
      .filter((lot) => !normalized || `${lot.name} ${lot.lotDate ?? ''} ${lot.notes ?? ''}`.toLowerCase().includes(normalized))
      .sort((first, second) => first.name.localeCompare(second.name));
  }

  save(lot: Lot): Promise<void> {
    return this.storage.put(COLLECTION, lot);
  }

  softDelete(id: string): Promise<void> {
    return this.storage.deleteLogical(COLLECTION, id);
  }
}