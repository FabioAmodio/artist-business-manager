import type { EntityId, IsoDateTime } from '../shared/types';

export type OperationType = 'sale' | 'work' | 'bundle';

export interface Operation {
  readonly id: EntityId;
  readonly type: OperationType;
  readonly title: string;
  readonly description?: string;
  readonly partyId?: EntityId;
  readonly fairEditionId?: EntityId;
  readonly productId?: EntityId;
  readonly serviceId?: EntityId;
  readonly bundleId?: EntityId;
  readonly parentOperationId?: EntityId;
  readonly lotId?: EntityId;
  readonly customerName?: string;
  readonly amount?: number;
  readonly quantity?: number;
  readonly notes?: string;
  readonly workStatus?: 'requested' | 'in-progress' | 'completed' | 'delivered' | 'cancelled';
  readonly deliveryDate?: string;
  readonly needsReview?: boolean;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
