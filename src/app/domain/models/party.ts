import type { EntityId, IsoDateTime } from '../shared/types';

export interface Party {
  readonly id: EntityId;
  readonly displayName: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
