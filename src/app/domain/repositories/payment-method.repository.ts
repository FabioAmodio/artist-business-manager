import type { PaymentMethod } from '../models/payment-method';
import type { EntityId } from '../shared/types';
import type { PaymentMethodFilter } from './repository-types';

export interface IPaymentMethodRepository {
  getById(id: EntityId): Promise<PaymentMethod | null>;
  list(filter?: PaymentMethodFilter): Promise<readonly PaymentMethod[]>;
  save(paymentMethod: PaymentMethod): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}