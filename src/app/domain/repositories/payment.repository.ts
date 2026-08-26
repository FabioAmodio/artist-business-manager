import type { Payment } from '../models/payment';
import type { EntityId } from '../shared/types';

export interface IPaymentRepository {
  getById(id: EntityId): Promise<Payment | null>;
  listByOperation(operationId: EntityId): Promise<readonly Payment[]>;
  list(): Promise<readonly Payment[]>;
  save(payment: Payment): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}