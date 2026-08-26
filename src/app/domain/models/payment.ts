import type { EntityId, IsoDateTime } from '../shared/types';

export interface Payment {
  readonly id: EntityId;
  readonly operationId: EntityId;
  readonly amount: number;
  readonly paymentDate: string;
  readonly paymentMethodId: EntityId;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}