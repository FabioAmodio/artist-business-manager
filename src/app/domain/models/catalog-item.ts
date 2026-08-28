import type { EntityId, IsoDateTime } from '../shared/types';

export type CatalogItemType = 'product' | 'service' | 'bundle';

export interface CatalogItem {
  readonly id: EntityId;
  readonly type: CatalogItemType;
  readonly name: string;
  readonly description?: string;
  readonly active?: boolean;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
