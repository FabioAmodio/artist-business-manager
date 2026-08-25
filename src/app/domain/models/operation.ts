import type { EntityId, IsoDateTime } from '../shared/types';

export type OperationType =
  | 'sale'
  | 'commission'
  | 'sketch'
  | 'other'
  | 'immediate-sale'
  | 'reservation'
  | 'commission-with-deposit'
  | 'fair-delivery-commission'
  | 'shipment-commission'
  | 'future';

export interface Operation {
  readonly id: EntityId;
  readonly type: OperationType;
  readonly title: string;
  readonly description?: string;
  readonly partyId?: EntityId;
  readonly fairEditionId?: EntityId;
  readonly productId?: EntityId;
  readonly amount?: number;
  readonly workStatus?: 'draft' | 'requested' | 'accepted' | 'in-progress' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  readonly saleStatus?: 'draft' | 'pending-payment' | 'partially-paid' | 'paid' | 'refunded' | 'cancelled';
  readonly economicStatus?: 'preventivato' | 'concordato' | 'acconto-ricevuto' | 'parzialmente-pagato' | 'pagato' | 'insoluto' | 'annullato';
  readonly needsReview?: boolean;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
