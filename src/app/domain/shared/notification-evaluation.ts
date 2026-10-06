import type { Operation } from '../models/operation';
import type { FairTask } from '../models/fair-task';
import type { NotificationEvent } from '../models/notification';
import type { IsoDateTime } from './types';

export interface NotificationPolicy {
  readonly dueSoonDays: number;
  readonly policyVersion: string;
}

export interface NotificationEvaluationResult {
  readonly candidates: readonly NotificationEvent[];
  readonly operationsAnalyzed: number;
}

const ACTIVE_WORK_STATUSES = new Set(['requested', 'in-progress']);
const ACTIVE_FAIR_TASK_STATUSES = new Set(['pending']);

export function evaluateOperationNotifications(
  operations: readonly Operation[],
  policy: NotificationPolicy,
  now: Date,
): NotificationEvaluationResult {
  const today = toLocalDate(now);
  const limit = addDays(today, Math.max(1, Math.round(policy.dueSoonDays)));
  const evaluated = operations.filter((operation) => ACTIVE_WORK_STATUSES.has(operation.workStatus ?? '') && Boolean(operation.deliveryDate) && !operation.deletedAt);
  const candidates = evaluated.flatMap((operation) => {
    const deliveryDate = operation.deliveryDate!;
    if (deliveryDate < today) return [createOperationEvent(operation, 'operation-overdue', deliveryDate, policy.policyVersion, now)];
    if (deliveryDate <= limit) return [createOperationEvent(operation, 'operation-due-soon', deliveryDate, policy.policyVersion, now)];
    return [];
  });
  return { candidates, operationsAnalyzed: operations.length };
}

export function evaluateFairTaskNotifications(
  tasks: readonly FairTask[],
  policy: NotificationPolicy,
  now: Date,
): NotificationEvaluationResult {
  const today = toLocalDate(now);
  const limit = addDays(today, Math.max(1, Math.round(policy.dueSoonDays)));
  const evaluated = tasks.filter((task) => ACTIVE_FAIR_TASK_STATUSES.has(task.status) && Boolean(task.dueDate) && !task.deletedAt);
  const candidates = evaluated.flatMap((task) => {
    const dueDate = task.dueDate!;
    if (dueDate < today) return [createFairTaskEvent(task, 'fair-task-overdue', dueDate, policy.policyVersion, now)];
    if (dueDate <= limit) return [createFairTaskEvent(task, 'fair-task-due-soon', dueDate, policy.policyVersion, now)];
    return [];
  });
  return { candidates, operationsAnalyzed: tasks.length };
}

function createOperationEvent(operation: Operation, kind: 'operation-due-soon' | 'operation-overdue', deliveryDate: string, policyVersion: string, now: Date): NotificationEvent {
  const occurrenceKey = `${policyVersion}:operation:${operation.id}:${deliveryDate}:${kind}`;
  return {
    id: occurrenceKey,
    occurrenceKey,
    kind,
    entityType: 'operation',
    entityId: operation.id,
    title: kind === 'operation-overdue' ? 'Lavorazione scaduta' : 'Lavorazione in scadenza',
    body: `${operation.title} - consegna ${deliveryDate}`,
    dueDate: deliveryDate,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function createFairTaskEvent(task: FairTask, kind: 'fair-task-due-soon' | 'fair-task-overdue', dueDate: string, policyVersion: string, now: Date): NotificationEvent {
  const occurrenceKey = `${policyVersion}:fair-task:${task.id}:${dueDate}:${kind}`;
  return {
    id: occurrenceKey,
    occurrenceKey,
    kind,
    entityType: 'fair-task',
    entityId: task.fairEditionId,
    title: kind === 'fair-task-overdue' ? 'Attivita fiera scaduta' : 'Attivita fiera in scadenza',
    body: `${task.title} - scadenza ${dueDate}`,
    dueDate,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function toLocalDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
}

export function notificationLocalDate(now: Date): string {
  return toLocalDate(now);
}

export type NotificationIsoDateTime = IsoDateTime;