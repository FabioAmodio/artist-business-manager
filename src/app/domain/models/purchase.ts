import type { EntityId, IsoDateTime } from '../shared/types';

export interface Purchase {
  readonly id: EntityId;
  readonly supplierId?: EntityId;
  readonly purchaseDate: string;
  readonly description: string;
  readonly totalAmount: number;
  readonly notes?: string;
  readonly productId?: EntityId;
  readonly lotId?: EntityId;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}