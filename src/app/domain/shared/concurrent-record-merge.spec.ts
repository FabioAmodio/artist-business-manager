import { describe, expect, it } from 'vitest';
import { mergeConcurrentRecord, mergeWorkStatus } from './concurrent-record-merge';

describe('concurrent record merge', () => {
  it('merges independent field changes', () => {
    const result = mergeConcurrentRecord(
      { id: 'client-1', email: 'old@example.com', phone: '000' },
      { id: 'client-1', email: 'new@example.com', phone: '000' },
      { id: 'client-1', email: 'old@example.com', phone: '111' },
      'parties',
    );

    expect(result.conflictFields).toEqual([]);
    expect(result.record).toMatchObject({ email: 'new@example.com', phone: '111' });
  });

  it('accepts the same concurrent value without conflict', () => {
    const result = mergeConcurrentRecord(
      { id: 'client-1', notes: '' },
      { id: 'client-1', notes: 'prefer email' },
      { id: 'client-1', notes: 'prefer email' },
      'parties',
    );

    expect(result.conflictFields).toEqual([]);
    expect(result.record?.['notes']).toBe('prefer email');
  });

  it('reports a conflict when the same field diverges', () => {
    const result = mergeConcurrentRecord(
      { id: 'client-1', email: 'old@example.com' },
      { id: 'client-1', email: 'a@example.com' },
      { id: 'client-1', email: 'b@example.com' },
      'parties',
    );

    expect(result.record).toBeNull();
    expect(result.conflictFields).toEqual(['email']);
  });

  it('keeps the most advanced non-cancelled work status', () => {
    expect(mergeWorkStatus('completed', 'delivered')).toBe('delivered');
    expect(mergeWorkStatus('in-progress', 'completed')).toBe('completed');
  });

  it('does not automatically merge cancellation with another status', () => {
    expect(mergeWorkStatus('cancelled', 'delivered')).toBeNull();
  });
});
