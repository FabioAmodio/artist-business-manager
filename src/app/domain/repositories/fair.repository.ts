import type { EntityId } from '../shared/types';
import type { Fair, FairEdition, FairSeries } from '../models/fair';
import type { FairFilter, FairSeriesFilter } from './repository-types';

export interface IFairSeriesRepository {
  getById(id: EntityId): Promise<FairSeries | null>;
  list(filter?: FairSeriesFilter): Promise<readonly FairSeries[]>;
  save(series: FairSeries): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}

export interface IFairEditionRepository {
  getById(id: EntityId): Promise<FairEdition | null>;
  list(filter?: FairFilter): Promise<readonly FairEdition[]>;
  listBySeries(seriesId: EntityId): Promise<readonly FairEdition[]>;
  findActive(onDate: string): Promise<readonly FairEdition[]>;
  save(edition: FairEdition): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}

/** @deprecated Use IFairEditionRepository for new code. */
export interface IFairRepository {
  getById(id: EntityId): Promise<Fair | null>;
  list(filter?: FairFilter): Promise<readonly Fair[]>;
  findActive(onDate: string): Promise<readonly Fair[]>;
  save(fair: Fair): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}
