export type WorkStatus = 'requested' | 'in-progress' | 'completed' | 'delivered' | 'cancelled';

export interface ConcurrentMergeResult {
  readonly record: Record<string, unknown> | null;
  readonly conflictFields: readonly string[];
}

const WORK_STATUS_ORDER: readonly WorkStatus[] = ['requested', 'in-progress', 'completed', 'delivered'];

export function mergeConcurrentRecord(
  base: Record<string, unknown> | undefined,
  local: Record<string, unknown> | undefined,
  remote: Record<string, unknown> | undefined,
  collection: string,
): ConcurrentMergeResult {
  if (!local && !remote) return { record: null, conflictFields: [] };
  if (!base) return equalValue(local, remote) ? { record: local ?? remote ?? null, conflictFields: [] } : { record: null, conflictFields: ['record'] };
  if (!local) return equalValue(base, remote) ? { record: null, conflictFields: [] } : { record: null, conflictFields: ['record'] };
  if (!remote) return equalValue(base, local) ? { record: null, conflictFields: [] } : { record: null, conflictFields: ['record'] };

  const fields = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)]);
  const merged: Record<string, unknown> = { ...remote };
  const conflicts: string[] = [];
  for (const field of fields) {
    if (isMetadataField(field)) continue;
    const baseValue = base[field];
    const localValue = local[field];
    const remoteValue = remote[field];
    if (equalValue(localValue, remoteValue)) {
      merged[field] = localValue;
    } else if (equalValue(localValue, baseValue)) {
      merged[field] = remoteValue;
    } else if (equalValue(remoteValue, baseValue)) {
      merged[field] = localValue;
    } else if (collection === 'operations' && field === 'workStatus') {
      const status = mergeWorkStatus(localValue, remoteValue);
      if (status) merged[field] = status;
      else conflicts.push(field);
    } else {
      conflicts.push(field);
    }
  }
  return conflicts.length ? { record: null, conflictFields: conflicts } : { record: merged, conflictFields: [] };
}

export function mergeWorkStatus(local: unknown, remote: unknown): WorkStatus | null {
  if (local === remote && isWorkStatus(local)) return local;
  if (!isWorkStatus(local) || !isWorkStatus(remote)) return null;
  if (local === 'cancelled' || remote === 'cancelled') return null;
  return WORK_STATUS_ORDER[Math.max(WORK_STATUS_ORDER.indexOf(local), WORK_STATUS_ORDER.indexOf(remote))];
}

function isMetadataField(field: string): boolean {
  return field === 'createdBy' || field === 'updatedBy' || field === 'version' || field === 'updatedAt';
}

function isWorkStatus(value: unknown): value is WorkStatus {
  return value === 'requested' || value === 'in-progress' || value === 'completed' || value === 'delivered' || value === 'cancelled';
}

function equalValue(first: unknown, second: unknown): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}
