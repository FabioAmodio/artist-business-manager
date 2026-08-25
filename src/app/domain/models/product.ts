import type { EntityId, IsoDateTime } from '../shared/types';

export interface Product {
  readonly id: EntityId;
  readonly name: string;
  readonly description?: string;
  readonly suggestedPrice?: number;
  readonly active: boolean;
  readonly tags: readonly string[];
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
