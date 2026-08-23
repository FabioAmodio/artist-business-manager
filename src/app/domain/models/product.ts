import type { EntityId, IsoDateTime } from '../shared/types';

export interface Product {
  readonly id: EntityId;
  readonly name: string;
  readonly description?: string;
  readonly basePrice?: number;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
