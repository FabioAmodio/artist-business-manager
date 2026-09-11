import type { IsoDateTime } from '../shared/types';

export interface WorkflowSettings {
  readonly id: 'current';
  readonly dueSoonDays: number;
  readonly catalogUsageFairCount: number;
  readonly updatedAt: IsoDateTime;
}