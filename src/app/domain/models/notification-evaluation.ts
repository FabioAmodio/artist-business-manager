import type { EntityId, IsoDateTime } from '../shared/types';

export type NotificationEvaluationStatus = 'running' | 'completed' | 'failed';

export interface NotificationEvaluationRun {
  readonly id: EntityId;
  readonly localDate: string;
  readonly userId?: EntityId;
  readonly workspaceId?: EntityId;
  readonly policyVersion: string;
  readonly status: NotificationEvaluationStatus;
  readonly operationsAnalyzed: number;
  readonly candidates: number;
  readonly newNotifications: number;
  readonly durationMs?: number;
  readonly errorMessage?: string;
  readonly startedAt: IsoDateTime;
  readonly completedAt?: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}

export interface NotificationStatsOutbox {
  readonly id: EntityId;
  readonly localDate: string;
  readonly userId?: EntityId;
  readonly workspaceId?: EntityId;
  readonly deviceId?: EntityId;
  readonly evaluations: number;
  readonly operationsAnalyzed: number;
  readonly candidates: number;
  readonly newNotifications: number;
  readonly deduplicatedNotifications: number;
  readonly removedNotifications: number;
  readonly snoozedNotifications: number;
  readonly completedNotifications: number;
  readonly dismissedNotifications: number;
  readonly errors: number;
  readonly updatedAt: IsoDateTime;
}