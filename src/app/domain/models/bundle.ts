import type { EntityId, IsoDateTime } from '../shared/types';

export interface Bundle {
  readonly id: EntityId;
  readonly name: string;
  readonly description?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
