import { Injectable, inject } from '@angular/core';
import { OperationRepository } from '../../core/repositories/operation.repository';
import type { Operation, OperationType } from '../../domain/models/operation';

export type OperationInput = Pick<Operation, 'type' | 'title' | 'description' | 'partyId' | 'fairEditionId' | 'amount' | 'workStatus' | 'saleStatus' | 'economicStatus' | 'needsReview'>;

@Injectable({ providedIn: 'root' })
export class OperationService {
  private readonly repository = inject(OperationRepository);

  list(type?: OperationType | 'all', query = ''): Promise<readonly Operation[]> {
    return this.repository.list({ type: type && type !== 'all' ? type : undefined, text: query || undefined });
  }

  async create(input: OperationInput): Promise<Operation> {
    this.validate(input);
    const now = new Date().toISOString();
    const operation: Operation = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.save(operation);
    return operation;
  }

  async update(id: string, input: OperationInput): Promise<Operation> {
    this.validate(input);
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Operazione non trovata.');
    const operation: Operation = { ...existing, ...input, updatedAt: new Date().toISOString() };
    await this.repository.save(operation);
    return operation;
  }

  delete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  private validate(input: OperationInput): void {
    if (!input.title.trim()) throw new Error('Il titolo dell\'operazione e obbligatorio.');
  }
}
