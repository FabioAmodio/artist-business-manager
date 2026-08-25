import type { Purchase } from '../models/purchase';
import type { PurchaseFilter } from './repository-types';
import type { EntityId } from '../shared/types';

export interface IPurchaseRepository {
  getById(id: EntityId): Promise<Purchase | null>;
  list(filter?: PurchaseFilter): Promise<readonly Purchase[]>;
  save(purchase: Purchase): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}