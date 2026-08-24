import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Operation } from '../../domain/models/operation';
import type { OperationFilter, OperationCompletionPatch, OperationTransition } from '../../domain/repositories/repository-types';
import type { IOperationRepository } from '../../domain/repositories/operation.repository';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'operations';

@Injectable({ providedIn: 'root' })
export class OperationRepository implements IOperationRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<Operation | null> {
    const operation = await this.storage.get<Operation>(COLLECTION, id);
    return operation?.deletedAt ? null : operation;
  }

  async list(filter?: OperationFilter): Promise<readonly Operation[]> {
    const operations = await this.storage.list<Operation>(COLLECTION);
    return operations
      .filter((operation) => filter?.includeDeleted || !operation.deletedAt)
      .filter((operation) => !filter?.type || operation.type === filter.type)
      .filter((operation) => !filter?.text || `${operation.title} ${operation.description ?? ''}`.toLowerCase().includes(filter.text.toLowerCase()))
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  }

  save(operation: Operation): Promise<void> {
    return this.storage.put(COLLECTION, operation);
  }

  async transition(id: string, transition: OperationTransition): Promise<Operation> {
    const operation = await this.getById(id);
    if (!operation) throw new Error('Operazione non trovata.');
    const updated: Operation = { ...operation, workStatus: transition.status as Operation['workStatus'], updatedAt: new Date().toISOString() };
    await this.save(updated);
    return updated;
  }

  async markComplete(id: string, _patch: OperationCompletionPatch): Promise<Operation> {
    const operation = await this.getById(id);
    if (!operation) throw new Error('Operazione non trovata.');
    const updated: Operation = { ...operation, needsReview: false, updatedAt: new Date().toISOString() };
    await this.save(updated);
    return updated;
  }

  softDelete(id: string): Promise<void> {
    return this.storage.deleteLogical(COLLECTION, id);
  }
}
