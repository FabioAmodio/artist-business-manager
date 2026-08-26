import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Payment } from '../../domain/models/payment';
import type { IPaymentRepository } from '../../domain/repositories/payment.repository';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'payments';

@Injectable({ providedIn: 'root' })
export class PaymentRepository implements IPaymentRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<Payment | null> {
    const payment = await this.storage.get<Payment>(COLLECTION, id);
    return payment?.deletedAt ? null : payment;
  }

  async list(): Promise<readonly Payment[]> {
    return (await this.storage.list<Payment>(COLLECTION))
      .filter((payment) => !payment.deletedAt)
      .sort((first, second) => second.paymentDate.localeCompare(first.paymentDate) || second.updatedAt.localeCompare(first.updatedAt));
  }

  async listByOperation(operationId: string): Promise<readonly Payment[]> {
    return (await this.list()).filter((payment) => payment.operationId === operationId);
  }

  save(payment: Payment): Promise<void> { return this.storage.put(COLLECTION, payment); }
  softDelete(id: string): Promise<void> { return this.storage.deleteLogical(COLLECTION, id); }
}