import type { EntityId, IsoDateTime } from '../shared/types';

export interface Service {
  readonly id: EntityId;
  readonly code: string;
  readonly description: string;
  readonly system: boolean;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}