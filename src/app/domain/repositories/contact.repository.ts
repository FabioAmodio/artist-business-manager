import type { EntityId } from '../shared/types';
import type { Party } from '../models/party';
import type { PartyFilter } from './repository-types';

/** Repository generico sull'intera anagrafica Party, senza restrizioni di ruolo (a differenza di IClientRepository/ISupplierRepository). */
export interface IContactRepository {
  getById(id: EntityId): Promise<Party | null>;
  list(filter?: PartyFilter): Promise<readonly Party[]>;
  save(party: Party): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}
