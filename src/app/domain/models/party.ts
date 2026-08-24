import type { EntityId, IsoDateTime } from '../shared/types';

export interface Party {
  readonly id: EntityId;
  readonly type: 'person' | 'organization';
  readonly displayName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly website?: string;
  readonly social?: string;
  readonly notes?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
