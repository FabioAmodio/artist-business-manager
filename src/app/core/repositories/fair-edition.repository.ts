import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { FairEdition } from '../../domain/models/fair';
import type { FairFilter } from '../../domain/repositories/repository-types';
import type { IFairEditionRepository } from '../../domain/repositories/fair.repository';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'fairEditions';

@Injectable({ providedIn: 'root' })
export class FairEditionRepository implements IFairEditionRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<FairEdition | null> {
    const edition = await this.storage.get<FairEdition>(COLLECTION, id);
    return edition?.deletedAt ? null : edition;
  }

  async list(filter?: FairFilter): Promise<readonly FairEdition[]> {
    const editions = await this.storage.list<FairEdition>(COLLECTION);
    return editions.filter((edition) => {
      if (!filter?.includeDeleted && edition.deletedAt) return false;
      if (filter?.text && !`${edition.name} ${edition.location}`.toLowerCase().includes(filter.text.toLowerCase())) return false;
      if (filter?.from && edition.endDate < filter.from) return false;
      if (filter?.to && edition.startDate > filter.to) return false;
      return true;
    }).sort((first, second) => second.startDate.localeCompare(first.startDate));
  }

  listBySeries(seriesId: string): Promise<readonly FairEdition[]> {
    return this.list().then((editions) => editions.filter((edition) => edition.fairSeriesId === seriesId));
  }

  findActive(onDate: string): Promise<readonly FairEdition[]> {
    return this.list().then((editions) => editions.filter(
      (edition) => edition.startDate <= onDate && onDate <= edition.endDate,
    ));
  }

  save(edition: FairEdition): Promise<void> {
    return this.storage.put(COLLECTION, edition);
  }

  softDelete(id: string): Promise<void> {
    return this.storage.deleteLogical(COLLECTION, id);
  }
}
