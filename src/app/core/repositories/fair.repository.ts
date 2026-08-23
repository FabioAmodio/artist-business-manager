import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Fair } from '../../domain/models/fair';
import type { FairFilter } from '../../domain/repositories/repository-types';
import type { IFairRepository } from '../../domain/repositories/fair.repository';
import type { IStorageProvider } from '../storage/storage-provider';

const FAIRS_COLLECTION = 'fairs';

@Injectable({ providedIn: 'root' })
export class FairRepository implements IFairRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<Fair | null> {
    const fair = await this.storage.get<Fair>(FAIRS_COLLECTION, id);
    return fair?.deletedAt ? null : fair;
  }

  async list(filter?: FairFilter): Promise<readonly Fair[]> {
    const fairs = await this.storage.list<Fair>(FAIRS_COLLECTION);
    return fairs.filter((fair) => {
      if (!filter?.includeDeleted && fair.deletedAt) return false;
      if (filter?.text && !`${fair.name} ${fair.location}`.toLowerCase().includes(filter.text.toLowerCase())) return false;
      if (filter?.from && fair.endDate < filter.from) return false;
      if (filter?.to && fair.startDate > filter.to) return false;
      return true;
    });
  }

  async findActive(onDate: string): Promise<readonly Fair[]> {
    return this.list().then((fairs) => fairs.filter(
      (fair) => fair.startDate <= onDate && onDate <= fair.endDate,
    ));
  }

  async save(fair: Fair): Promise<void> {
    await this.storage.put(FAIRS_COLLECTION, fair);
  }

  async softDelete(id: string): Promise<void> {
    await this.storage.deleteLogical(FAIRS_COLLECTION, id);
  }
}
