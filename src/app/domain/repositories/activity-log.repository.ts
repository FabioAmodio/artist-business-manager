import type { EntityId } from '../shared/types';
import type { ActivityLogEntry, ActivityLogSubjectType } from '../models/activity-log';

export interface IActivityLogRepository {
  getById(id: EntityId): Promise<ActivityLogEntry | null>;
  listBySubject(subjectType: ActivityLogSubjectType, subjectId: EntityId): Promise<readonly ActivityLogEntry[]>;
  listAll(): Promise<readonly ActivityLogEntry[]>;
  save(entry: ActivityLogEntry): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}
