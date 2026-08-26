import type { EntityId, IsoDateTime } from '../shared/types';

export interface PaymentMethod {
  readonly id: EntityId;
  readonly name: string;
  readonly system: boolean;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}