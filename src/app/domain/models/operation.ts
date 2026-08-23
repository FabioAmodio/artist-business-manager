import type { EntityId, IsoDateTime } from '../shared/types';

export type OperationType =
  | 'immediate-sale'
  | 'commission'
  | 'reservation'
  | 'commission-with-deposit'
  | 'fair-delivery-commission'
  | 'shipment-commission'
  | 'future';

export interface Operation {
  readonly id: EntityId;
  readonly type: OperationType;
  readonly description?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
