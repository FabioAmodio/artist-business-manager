import type { EntityId, IsoDateTime } from '../shared/types';

export type NotificationKind = 'operation-due-soon' | 'operation-overdue' | 'reminder';

export interface NotificationEvent {
  readonly id: EntityId;
  readonly occurrenceKey: string;
  readonly kind: NotificationKind;
  readonly entityType?: 'operation' | 'reminder';
  readonly entityId?: EntityId;
  readonly title: string;
  readonly body: string;
  readonly dueDate?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}

export type NotificationStateStatus = 'pending' | 'snoozed' | 'done' | 'dismissed';

export interface NotificationState {
  readonly id: EntityId;
  readonly notificationId: EntityId;
  readonly userId?: EntityId;
  readonly status: NotificationStateStatus;
  readonly readAt?: IsoDateTime;
  readonly snoozedUntil?: IsoDateTime;
  readonly completedAt?: IsoDateTime;
  readonly dismissedAt?: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}