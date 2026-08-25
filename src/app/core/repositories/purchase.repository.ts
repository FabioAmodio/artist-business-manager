import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Purchase } from '../../domain/models/purchase';
import type { IPurchaseRepository } from '../../domain/repositories/purchase.repository';
import type { PurchaseFilter } from '../../domain/repositories/repository-types';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'purchases';

@Injectable({ providedIn: 'root' })
export class PurchaseRepository implements IPurchaseRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<Purchase | null> {
    const purchase = await this.storage.get<Purchase>(COLLECTION, id);
    return purchase?.deletedAt ? null : purchase;
  }

  async list(filter?: PurchaseFilter): Promise<readonly Purchase[]> {
    const normalized = filter?.text?.trim().toLowerCase() ?? '';
    const purchases = await this.storage.list<Purchase>(COLLECTION);
    return purchases
      .filter((purchase) => filter?.includeDeleted || !purchase.deletedAt)
      .filter((purchase) => !filter?.supplierId || purchase.supplierId === filter.supplierId)
      .filter((purchase) => !normalized || `${purchase.purchaseDate} ${purchase.description} ${purchase.notes ?? ''} ${purchase.totalAmount}`.toLowerCase().includes(normalized))
      .sort((first, second) => second.purchaseDate.localeCompare(first.purchaseDate) || second.updatedAt.localeCompare(first.updatedAt));
  }

  save(purchase: Purchase): Promise<void> {
    return this.storage.put(COLLECTION, purchase);
  }

  softDelete(id: string): Promise<void> {
    return this.storage.deleteLogical(COLLECTION, id);
  }
}