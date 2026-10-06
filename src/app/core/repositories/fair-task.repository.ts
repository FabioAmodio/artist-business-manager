import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { FairTask } from '../../domain/models/fair-task';
import type { IFairTaskRepository } from '../../domain/repositories/fair.repository';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'fairTasks';

@Injectable({ providedIn: 'root' })
export class FairTaskRepository implements IFairTaskRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<FairTask | null> {
    const task = await this.storage.get<FairTask>(COLLECTION, id);
    return task?.deletedAt ? null : task;
  }

  async listByFairEdition(fairEditionId: string): Promise<readonly FairTask[]> {
    const tasks = await this.storage.list<FairTask>(COLLECTION);
    return tasks.filter((task) => task.fairEditionId === fairEditionId && !task.deletedAt);
  }

  async listAll(): Promise<readonly FairTask[]> {
    const tasks = await this.storage.list<FairTask>(COLLECTION);
    return tasks.filter((task) => !task.deletedAt);
  }

  save(task: FairTask): Promise<void> {
    return this.storage.put(COLLECTION, task);
  }

  softDelete(id: string): Promise<void> {
    return this.storage.deleteLogical(COLLECTION, id);
  }
}
