import type { Service } from '../models/service';
import type { EntityId } from '../shared/types';
import type { ServiceFilter } from './repository-types';

export interface IServiceRepository {
  getById(id: EntityId): Promise<Service | null>;
  list(filter?: ServiceFilter): Promise<readonly Service[]>;
  save(service: Service): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}