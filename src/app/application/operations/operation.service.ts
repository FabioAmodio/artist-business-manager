import { Injectable, inject } from '@angular/core';
import { OperationRepository } from '../../core/repositories/operation.repository';
import type { Operation, OperationType } from '../../domain/models/operation';
import { NotificationService } from '../notifications/notification.service';

export type OperationInput = Pick<Operation, 'type' | 'title' | 'description' | 'partyId' | 'fairEditionId' | 'productId' | 'serviceId' | 'bundleId' | 'parentOperationId' | 'lotId' | 'customerName' | 'amount' | 'quantity' | 'operationDate' | 'notes' | 'workStatus' | 'deliveryDate' | 'needsReview'>;

@Injectable({ providedIn: 'root' })
export class OperationService {
  private readonly repository = inject(OperationRepository);
  private readonly notifications = inject(NotificationService);

  list(type?: OperationType | 'all', query = ''): Promise<readonly Operation[]> {
    return this.repository.list({ type: type && type !== 'all' ? type : undefined, text: query || undefined });
  }

  async create(input: OperationInput): Promise<Operation> {
    this.validate(input);
    const now = new Date().toISOString();
    const operation: Operation = {
      ...input,
      quantity: input.quantity ?? 1,
      operationDate: input.operationDate ?? now,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.save(operation);
    this.triggerNotificationRecalculation();
    return operation;
  }

  async update(id: string, input: OperationInput): Promise<Operation> {
    this.validate(input);
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Operazione non trovata.');
    const operation: Operation = { ...existing, ...input, updatedAt: new Date().toISOString() };
    await this.repository.save(operation);
    this.triggerNotificationRecalculation();
    return operation;
  }

  async transitionWorkStatus(id: string, status: NonNullable<Operation['workStatus']>): Promise<Operation> {
    const operation = await this.repository.transition(id, { status });
    this.triggerNotificationRecalculation();
    return operation;
  }

  async advanceWorkStatus(id: string): Promise<Operation> {
    const operation = await this.repository.getById(id);
    if (!operation) throw new Error('Operazione non trovata.');
    const nextStatus = operation.workStatus === 'requested' ? 'in-progress'
      : operation.workStatus === 'in-progress' ? 'completed'
        : operation.workStatus === 'completed' ? 'delivered'
        : null;
    if (!nextStatus) throw new Error('La lavorazione non puo essere avanzata ulteriormente.');
    const updated = await this.repository.transition(id, { status: nextStatus });
    this.triggerNotificationRecalculation();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
    this.triggerNotificationRecalculation();
  }

  private triggerNotificationRecalculation(): void {
    void this.notifications.recalculate().catch((error) => console.error('Notification recalculation failed:', error));
  }

  private validate(input: OperationInput): void {
    if (!input.title.trim()) throw new Error('Il titolo dell\'operazione e obbligatorio.');
    if (input.productId && input.serviceId) throw new Error('Un\'operazione puo riferire un prodotto oppure un servizio, non entrambi.');
    if (input.quantity !== undefined && (!Number.isInteger(input.quantity) || input.quantity <= 0)) throw new Error('La quantita deve essere un numero intero maggiore di zero.');
  }
}
