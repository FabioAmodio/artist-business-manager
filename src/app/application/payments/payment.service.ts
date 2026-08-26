import { Injectable, inject } from '@angular/core';
import { PaymentRepository } from '../../core/repositories/payment.repository';
import type { Payment } from '../../domain/models/payment';

export type PaymentInput = Pick<Payment, 'operationId' | 'amount' | 'paymentDate' | 'paymentMethodId'>;

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly repository = inject(PaymentRepository);

  list(): Promise<readonly Payment[]> { return this.repository.list(); }
  listByOperation(operationId: string): Promise<readonly Payment[]> { return this.repository.listByOperation(operationId); }

  async create(input: PaymentInput): Promise<Payment> {
    this.validate(input);
    const now = new Date().toISOString();
    const payment: Payment = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    await this.repository.save(payment);
    return payment;
  }

  async update(id: string, input: PaymentInput): Promise<Payment> {
    this.validate(input);
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Pagamento non trovato.');
    const payment: Payment = { ...existing, ...input, updatedAt: new Date().toISOString() };
    await this.repository.save(payment);
    return payment;
  }

  delete(id: string): Promise<void> { return this.repository.softDelete(id); }

  private validate(input: PaymentInput): void {
    if (!input.operationId) throw new Error('L\'operazione e obbligatoria.');
    if (!input.paymentDate) throw new Error('La data del pagamento e obbligatoria.');
    if (!input.paymentMethodId) throw new Error('La modalita di pagamento e obbligatoria.');
    if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('L\'importo del pagamento deve essere maggiore di zero.');
  }
}