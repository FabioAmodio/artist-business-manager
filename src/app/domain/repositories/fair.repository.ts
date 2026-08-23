import type { EntityId } from '../shared/types';
import type { Fair } from '../models/fair';
import type { FairFilter } from './repository-types';

export interface IFairRepository {
  getById(id: EntityId): Promise<Fair | null>;
  list(filter?: FairFilter): Promise<readonly Fair[]>;
  findActive(onDate: string): Promise<readonly Fair[]>;
  save(fair: Fair): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}
