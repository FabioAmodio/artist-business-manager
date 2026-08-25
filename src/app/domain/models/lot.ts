import type { EntityId, IsoDateTime } from '../shared/types';

export interface Lot {
  readonly id: EntityId;
  readonly name: string;
  readonly productId: EntityId;
  readonly purchaseId?: EntityId;
  readonly aliases: readonly string[];
  readonly notes?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}