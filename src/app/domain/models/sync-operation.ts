import type { EntityId, IsoDateTime } from '../shared/types';

export type SyncOperationStatus = 'pending' | 'error' | 'conflict';

export interface SyncOperation {
  readonly id: EntityId;
  readonly deviceId: EntityId;
  readonly collection: string;
  readonly entityId: EntityId;
  readonly action: 'create' | 'update' | 'delete';
  readonly before?: Record<string, unknown>;
  readonly after?: Record<string, unknown>;
  readonly status: SyncOperationStatus;
  readonly errorMessage?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly retryCount: number;
}
