import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { ActivityLogEntry, ActivityLogSubjectType } from '../../domain/models/activity-log';
import type { IActivityLogRepository } from '../../domain/repositories/activity-log.repository';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'activityLog';

@Injectable({ providedIn: 'root' })
export class ActivityLogRepository implements IActivityLogRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<ActivityLogEntry | null> {
    const entry = await this.storage.get<ActivityLogEntry>(COLLECTION, id);
    return entry?.deletedAt ? null : entry;
  }

  async listBySubject(subjectType: ActivityLogSubjectType, subjectId: string): Promise<readonly ActivityLogEntry[]> {
    const entries = await this.storage.list<ActivityLogEntry>(COLLECTION);
    return entries.filter((entry) => entry.subjectType === subjectType && entry.subjectId === subjectId && !entry.deletedAt);
  }

  async listAll(): Promise<readonly ActivityLogEntry[]> {
    const entries = await this.storage.list<ActivityLogEntry>(COLLECTION);
    return entries.filter((entry) => !entry.deletedAt);
  }

  save(entry: ActivityLogEntry): Promise<void> {
    return this.storage.put(COLLECTION, entry);
  }

  softDelete(id: string): Promise<void> {
    return this.storage.deleteLogical(COLLECTION, id);
  }
}
