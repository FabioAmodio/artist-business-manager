import type { Lot } from '../models/lot';
import type { LotFilter } from './repository-types';
import type { EntityId } from '../shared/types';

export interface ILotRepository {
  getById(id: EntityId): Promise<Lot | null>;
  list(filter?: LotFilter): Promise<readonly Lot[]>;
  save(lot: Lot): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}