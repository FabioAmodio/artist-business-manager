import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { FairSeries } from '../../domain/models/fair';
import type { FairSeriesFilter } from '../../domain/repositories/repository-types';
import type { IFairSeriesRepository } from '../../domain/repositories/fair.repository';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'fairSeries';

@Injectable({ providedIn: 'root' })
export class FairSeriesRepository implements IFairSeriesRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<FairSeries | null> {
    const series = await this.storage.get<FairSeries>(COLLECTION, id);
    return series?.deletedAt ? null : series;
  }

  async list(filter?: FairSeriesFilter): Promise<readonly FairSeries[]> {
    const series = await this.storage.list<FairSeries>(COLLECTION);
    return series.filter((item) => {
      if (!filter?.includeDeleted && item.deletedAt) return false;
      return !filter?.text || item.name.toLowerCase().includes(filter.text.toLowerCase());
    });
  }

  save(series: FairSeries): Promise<void> {
    return this.storage.put(COLLECTION, series);
  }

  softDelete(id: string): Promise<void> {
    return this.storage.deleteLogical(COLLECTION, id);
  }
}
