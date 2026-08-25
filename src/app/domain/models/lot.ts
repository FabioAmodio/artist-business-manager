import type { EntityId, IsoDateTime } from '../shared/types';

export type LotAssignmentStatus = 'assigned' | 'needs-review' | 'unassigned';

export interface LotSuggestion {
  readonly lotId: EntityId;
  readonly reason: string;
  readonly confidence?: number;
}

export interface Lot {
  readonly id: EntityId;
  readonly name: string;
  readonly productId: EntityId;
  readonly purchaseId?: EntityId;
  readonly lotDate?: string;
  readonly initialQuantity?: number;
  readonly remainingQuantity?: number;
  readonly totalCost?: number;
  readonly unitCost?: number;
  readonly notes?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}