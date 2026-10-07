import { Injectable, inject } from '@angular/core';
import { PaymentMethodRepository } from '../../core/repositories/payment-method.repository';
import type { PaymentMethod } from '../../domain/models/payment-method';

export type PaymentMethodInput = Pick<PaymentMethod, 'name'>;

@Injectable({ providedIn: 'root' })
export class PaymentMethodService {
  private readonly repository = inject(PaymentMethodRepository);

  async list(query = ''): Promise<readonly PaymentMethod[]> {
    return this.repository.list({ text: query || undefined });
  }

  async create(input: PaymentMethodInput): Promise<PaymentMethod> {
    this.validate(input);
    const now = new Date().toISOString();
    const paymentMethod: PaymentMethod = { id: crypto.randomUUID(), name: input.name.trim(), system: false, createdAt: now, updatedAt: now };
    await this.repository.save(paymentMethod);
    return paymentMethod;
  }

  async update(id: string, input: PaymentMethodInput): Promise<PaymentMethod> {
    this.validate(input);
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Modalita di pagamento non trovata.');
    const paymentMethod: PaymentMethod = { ...existing, name: input.name.trim(), updatedAt: new Date().toISOString() };
    await this.repository.save(paymentMethod);
    return paymentMethod;
  }

  async delete(id: string): Promise<void> {
    const paymentMethod = await this.repository.getById(id);
    if (!paymentMethod) throw new Error('Modalita di pagamento non trovata.');
    if (paymentMethod.system) throw new Error('Le modalita di sistema non possono essere eliminate.');
    await this.repository.softDelete(id);
  }

  private validate(input: PaymentMethodInput): void {
    if (!input.name.trim()) throw new Error('Il nome e obbligatorio.');
  }
}