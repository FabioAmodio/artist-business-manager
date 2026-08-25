import type { Party } from '../models/party';
import type { EntityId } from '../shared/types';

export interface ISupplierRepository {
  getById(id: EntityId): Promise<Party | null>;
  search(query: string, limit?: number): Promise<readonly Party[]>;
  save(supplier: Party): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}