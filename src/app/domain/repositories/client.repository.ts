import type { EntityId } from '../shared/types';
import type { Party } from '../models/party';

export interface IClientRepository {
  getById(id: EntityId): Promise<Party | null>;
  search(query: string, limit?: number): Promise<readonly Party[]>;
  save(client: Party): Promise<void>;
  convertSoftCustomer(operationId: EntityId, partyId: EntityId): Promise<void>;
}
