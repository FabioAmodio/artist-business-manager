import { describe, expect, it } from 'vitest';
import { evaluateOperationNotifications } from './notification-evaluation';
import type { Operation } from '../models/operation';

const operation = (overrides: Partial<Operation> = {}): Operation => ({
  id: 'operation-1',
  type: 'work',
  title: 'Lavorazione',
  workStatus: 'in-progress',
  deliveryDate: '2026-09-15',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

describe('evaluateOperationNotifications', () => {
  const policy = { dueSoonDays: 7, policyVersion: 'workflow-v1:7' };
  const now = new Date(2026, 8, 11, 9, 0, 0);

  it('returns due-soon operations within the configured threshold', () => {
    const result = evaluateOperationNotifications([operation()], policy, now);

    expect(result.operationsAnalyzed).toBe(1);
    expect(result.candidates[0]).toMatchObject({ kind: 'operation-due-soon', entityId: 'operation-1' });
  });

  it('returns overdue operations separately', () => {
    const result = evaluateOperationNotifications([operation({ deliveryDate: '2026-09-10' })], policy, now);

    expect(result.candidates[0]?.kind).toBe('operation-overdue');
  });

  it('ignores inactive, deleted, and undated operations', () => {
    const result = evaluateOperationNotifications([
      operation({ id: 'completed', workStatus: 'completed' }),
      operation({ id: 'deleted', deletedAt: '2026-09-01T00:00:00.000Z' }),
      operation({ id: 'undated', deliveryDate: undefined }),
    ], policy, now);

    expect(result.candidates).toHaveLength(0);
    expect(result.operationsAnalyzed).toBe(3);
  });

  it('uses a stable occurrence key for repeated evaluations', () => {
    const first = evaluateOperationNotifications([operation()], policy, now).candidates[0];
    const second = evaluateOperationNotifications([operation()], policy, new Date(2026, 8, 11, 18, 0, 0)).candidates[0];

    expect(first?.occurrenceKey).toBe(second?.occurrenceKey);
    expect(first?.id).toBe(second?.id);
  });
});