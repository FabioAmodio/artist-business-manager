import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { PaymentMethod } from '../../domain/models/payment-method';
import type { IPaymentMethodRepository } from '../../domain/repositories/payment-method.repository';
import type { PaymentMethodFilter } from '../../domain/repositories/repository-types';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'paymentMethods';

@Injectable({ providedIn: 'root' })
export class PaymentMethodRepository implements IPaymentMethodRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<PaymentMethod | null> {
    const paymentMethod = await this.storage.get<PaymentMethod>(COLLECTION, id);
    return paymentMethod?.deletedAt ? null : paymentMethod;
  }

  async list(filter?: PaymentMethodFilter): Promise<readonly PaymentMethod[]> {
    const normalized = filter?.text?.trim().toLowerCase() ?? '';
    const paymentMethods = await this.storage.list<PaymentMethod>(COLLECTION);
    return paymentMethods
      .filter((paymentMethod) => filter?.includeDeleted || !paymentMethod.deletedAt)
      .filter((paymentMethod) => !normalized || paymentMethod.name.toLowerCase().includes(normalized))
      .sort((first, second) => first.name.localeCompare(second.name));
  }

  save(paymentMethod: PaymentMethod): Promise<void> {
    return this.storage.put(COLLECTION, paymentMethod);
  }

  softDelete(id: string): Promise<void> {
    return this.storage.deleteLogical(COLLECTION, id);
  }
}