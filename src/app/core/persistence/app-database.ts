import Dexie, { type Table } from 'dexie';
import type { FairEdition, FairSeries } from '../../domain/models/fair';
import type { Lot } from '../../domain/models/lot';
import type { Operation } from '../../domain/models/operation';
import type { PaymentMethod } from '../../domain/models/payment-method';
import type { Payment } from '../../domain/models/payment';
import type { Party } from '../../domain/models/party';
import type { Product } from '../../domain/models/product';
import type { Purchase } from '../../domain/models/purchase';
import type { Service } from '../../domain/models/service';

export const DATABASE_NAME = 'artist-business-manager';
export const DATABASE_VERSION = 18;

interface LegacyFair {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly notes?: string;
  readonly expectedBudget?: number;
  readonly standCost?: number;
  readonly reimbursement?: number;
  readonly hotelCost?: number;
  readonly travelCost?: number;
  readonly otherCosts?: number;
  readonly standPaid?: boolean;
  readonly travelPaid?: boolean;
  readonly hotelPaid?: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt?: string;
}

type LegacyOperation = Omit<Operation, 'type'> & { readonly type: string };
type LegacyPaymentOperation = LegacyOperation & { readonly paymentMethodId?: string };

export class AppDatabase extends Dexie {
  readonly fairs!: Table<FairEdition, string>;
  readonly fairSeries!: Table<FairSeries, string>;
  readonly fairEditions!: Table<FairEdition, string>;
  readonly lots!: Table<Lot, string>;
  readonly operations!: Table<Operation, string>;
  readonly paymentMethods!: Table<PaymentMethod, string>;
  readonly payments!: Table<Payment, string>;
  readonly parties!: Table<Party, string>;
  readonly products!: Table<Product, string>;
  readonly purchases!: Table<Purchase, string>;
  readonly services!: Table<Service, string>;

  constructor(databaseName = DATABASE_NAME) {
    super(databaseName);
    this.version(11).stores({
      fairs: 'id, startDate, endDate, updatedAt, deletedAt',
      fairSeries: 'id, name, updatedAt, deletedAt',
      fairEditions: 'id, fairSeriesId, edition, year, startDate, endDate, updatedAt, deletedAt',
      lots: 'id, productId, purchaseId, updatedAt, deletedAt',
      operations: 'id, type, partyId, fairEditionId, updatedAt, deletedAt',
      parties: 'id, type, displayName, email, updatedAt, deletedAt',
      products: 'id, name, active, updatedAt, deletedAt',
      purchases: 'id, supplierId, purchaseDate, productId, updatedAt, deletedAt',
    }).upgrade(async (transaction) => {
      const legacyFairs = await transaction.table('fairs').toArray() as LegacyFair[];
      const series = legacyFairs.map((fair) => ({
        id: fair.id,
        name: fair.name,
        defaultLocation: fair.location,
        createdAt: fair.createdAt,
        updatedAt: fair.updatedAt,
        deletedAt: fair.deletedAt,
      } satisfies FairSeries));
      await transaction.table('fairSeries').bulkPut(series);
      await transaction.table('fairEditions').bulkPut(legacyFairs.map((fair) => ({
        ...fair,
        fairSeriesId: fair.id,
        edition: fair.startDate.slice(0, 4),
        year: Number(fair.startDate.slice(0, 4)),
      })));
    });
    this.version(12).stores({
      fairs: 'id, startDate, endDate, updatedAt, deletedAt',
      fairSeries: 'id, name, updatedAt, deletedAt',
      fairEditions: 'id, fairSeriesId, edition, year, startDate, endDate, updatedAt, deletedAt',
      lots: 'id, productId, purchaseId, updatedAt, deletedAt',
      operations: 'id, type, partyId, fairEditionId, updatedAt, deletedAt',
      paymentMethods: 'id, name, system, updatedAt, deletedAt',
      parties: 'id, type, displayName, email, updatedAt, deletedAt',
      products: 'id, name, active, updatedAt, deletedAt',
      purchases: 'id, supplierId, purchaseDate, productId, updatedAt, deletedAt',
    }).upgrade(async (transaction) => {
      const operations = await transaction.table('operations').toArray() as LegacyPaymentOperation[];
      await transaction.table('operations').bulkPut(operations.map((operation) => operation.type === 'sale' ? { ...operation, paymentMethodId: operation.paymentMethodId ?? 'system-payment-method-contanti' } : operation));
    });
    this.version(13).stores({
      fairs: 'id, startDate, endDate, updatedAt, deletedAt',
      fairSeries: 'id, name, updatedAt, deletedAt',
      fairEditions: 'id, fairSeriesId, edition, year, startDate, endDate, updatedAt, deletedAt',
      lots: 'id, productId, purchaseId, updatedAt, deletedAt',
      operations: 'id, type, partyId, fairEditionId, serviceId, updatedAt, deletedAt',
      paymentMethods: 'id, name, system, updatedAt, deletedAt',
      parties: 'id, type, displayName, email, updatedAt, deletedAt',
      products: 'id, name, active, updatedAt, deletedAt',
      purchases: 'id, supplierId, purchaseDate, productId, updatedAt, deletedAt',
      services: 'id, code, description, system, updatedAt, deletedAt',
    }).upgrade(async (transaction) => {
      const operations = await transaction.table('operations').toArray() as LegacyPaymentOperation[];
      await transaction.table('operations').bulkPut(operations.map((operation) => {
        if (operation.type === 'commission' || operation.type === 'sketch') {
          return { ...operation, type: 'sale' as const, serviceId: `system-service-${operation.type}`, productId: undefined, paymentMethodId: operation.paymentMethodId ?? 'system-payment-method-contanti', workStatus: operation.workStatus ?? 'requested' };
        }
        return { ...operation, type: operation.type === 'sale' ? 'sale' as const : 'work' as const };
      }));
    });
    this.version(14).stores({
      fairs: 'id, startDate, endDate, updatedAt, deletedAt',
      fairSeries: 'id, name, updatedAt, deletedAt',
      fairEditions: 'id, fairSeriesId, edition, year, startDate, endDate, updatedAt, deletedAt',
      lots: 'id, productId, purchaseId, updatedAt, deletedAt',
      operations: 'id, type, partyId, fairEditionId, serviceId, updatedAt, deletedAt',
      paymentMethods: 'id, name, system, updatedAt, deletedAt',
      parties: 'id, type, displayName, email, updatedAt, deletedAt',
      products: 'id, name, active, updatedAt, deletedAt',
      purchases: 'id, supplierId, purchaseDate, productId, updatedAt, deletedAt',
      services: 'id, code, description, system, updatedAt, deletedAt',
    }).upgrade(async (transaction) => {
      const operations = await transaction.table('operations').toArray() as Array<Operation & { readonly workStatus?: string }>;
      const statusMap: Record<string, NonNullable<Operation['workStatus']>> = {
        draft: 'requested',
        requested: 'requested',
        accepted: 'requested',
        'in-progress': 'in-progress',
        ready: 'completed',
        completed: 'completed',
        delivered: 'delivered',
        cancelled: 'cancelled',
      };
      await transaction.table('operations').bulkPut(operations.map((operation) => ({
        ...operation,
        workStatus: operation.workStatus ? (statusMap[operation.workStatus] ?? 'requested') : undefined,
      })));
    });
    this.version(15).stores({
      fairs: 'id, startDate, endDate, updatedAt, deletedAt',
      fairSeries: 'id, name, updatedAt, deletedAt',
      fairEditions: 'id, fairSeriesId, edition, year, startDate, endDate, updatedAt, deletedAt',
      lots: 'id, productId, purchaseId, updatedAt, deletedAt',
      operations: 'id, type, partyId, fairEditionId, serviceId, updatedAt, deletedAt',
      paymentMethods: 'id, name, system, updatedAt, deletedAt',
      parties: 'id, type, displayName, email, updatedAt, deletedAt',
      products: 'id, name, active, updatedAt, deletedAt',
      purchases: 'id, supplierId, purchaseDate, productId, updatedAt, deletedAt',
      services: 'id, code, description, system, updatedAt, deletedAt',
    }).upgrade(async (transaction) => {
      const operations = await transaction.table('operations').toArray() as Array<Operation & { readonly economicStatus?: unknown }>;
      await transaction.table('operations').bulkPut(operations.map(({ economicStatus: _economicStatus, ...operation }) => operation));
    });
    this.version(16).stores({
      fairs: 'id, startDate, endDate, updatedAt, deletedAt',
      fairSeries: 'id, name, updatedAt, deletedAt',
      fairEditions: 'id, fairSeriesId, edition, year, startDate, endDate, updatedAt, deletedAt',
      lots: 'id, productId, purchaseId, updatedAt, deletedAt',
      operations: 'id, type, partyId, fairEditionId, serviceId, updatedAt, deletedAt',
      paymentMethods: 'id, name, system, updatedAt, deletedAt',
      payments: 'id, operationId, paymentDate, paymentMethodId, updatedAt, deletedAt',
      parties: 'id, type, displayName, email, updatedAt, deletedAt',
      products: 'id, name, active, updatedAt, deletedAt',
      purchases: 'id, supplierId, purchaseDate, productId, updatedAt, deletedAt',
      services: 'id, code, description, system, updatedAt, deletedAt',
    }).upgrade(async (transaction) => {
      const operations = await transaction.table('operations').toArray() as Array<Operation & { readonly paymentMethodId?: string; readonly saleStatus?: unknown }>;
      const payments = operations
        .filter((operation) => operation.paymentMethodId && typeof operation.amount === 'number' && operation.amount > 0)
        .map((operation) => ({
          id: `legacy-payment-${operation.id}`,
          operationId: operation.id,
          amount: operation.amount!,
          paymentDate: operation.createdAt.slice(0, 10),
          paymentMethodId: operation.paymentMethodId!,
          createdAt: operation.createdAt,
          updatedAt: operation.updatedAt,
          deletedAt: operation.deletedAt,
        } satisfies Payment));
      await transaction.table('payments').bulkPut(payments);
      await transaction.table('operations').bulkPut(operations.map(({ paymentMethodId: _paymentMethodId, saleStatus: _saleStatus, ...operation }) => operation));
    });
    this.version(17).stores({
      fairs: 'id, startDate, endDate, updatedAt, deletedAt',
      fairSeries: 'id, name, updatedAt, deletedAt',
      fairEditions: 'id, fairSeriesId, edition, year, startDate, endDate, updatedAt, deletedAt',
      lots: 'id, productId, purchaseId, updatedAt, deletedAt',
      operations: 'id, type, partyId, fairEditionId, serviceId, updatedAt, deletedAt',
      paymentMethods: 'id, name, system, updatedAt, deletedAt',
      payments: 'id, operationId, paymentDate, paymentMethodId, updatedAt, deletedAt',
      parties: 'id, type, displayName, email, updatedAt, deletedAt',
      products: 'id, name, active, updatedAt, deletedAt',
      purchases: 'id, supplierId, purchaseDate, productId, updatedAt, deletedAt',
      services: 'id, code, description, system, updatedAt, deletedAt',
    }).upgrade(async (transaction) => {
      const operations = await transaction.table('operations').toArray() as Array<Operation & { readonly saleStatus?: unknown }>;
      await transaction.table('operations').bulkPut(operations.map(({ saleStatus: _saleStatus, ...operation }) => operation));
    });
    this.version(DATABASE_VERSION).stores({
      fairs: 'id, startDate, endDate, updatedAt, deletedAt',
      fairSeries: 'id, name, updatedAt, deletedAt',
      fairEditions: 'id, fairSeriesId, edition, year, startDate, endDate, updatedAt, deletedAt',
      lots: 'id, productId, purchaseId, updatedAt, deletedAt',
      operations: 'id, type, partyId, fairEditionId, serviceId, deliveryDate, updatedAt, deletedAt',
      paymentMethods: 'id, name, system, updatedAt, deletedAt',
      payments: 'id, operationId, paymentDate, paymentMethodId, updatedAt, deletedAt',
      parties: 'id, type, displayName, email, updatedAt, deletedAt',
      products: 'id, name, active, updatedAt, deletedAt',
      purchases: 'id, supplierId, purchaseDate, productId, updatedAt, deletedAt',
      services: 'id, code, description, system, updatedAt, deletedAt',
    }).upgrade(async (transaction) => {
      const operations = await transaction.table('operations').toArray() as Operation[];
      await transaction.table('operations').bulkPut(operations.map((operation) => operation.workStatus && !operation.deliveryDate ? { ...operation, deliveryDate: operation.createdAt.slice(0, 10) } : operation));
    });
  }

  async openDatabase(): Promise<void> {
    await this.open();
  }
}
