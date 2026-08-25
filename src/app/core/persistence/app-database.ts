import Dexie, { type Table } from 'dexie';
import type { FairEdition, FairSeries } from '../../domain/models/fair';
import type { Operation } from '../../domain/models/operation';
import type { Party } from '../../domain/models/party';
import type { Product } from '../../domain/models/product';
import type { Purchase } from '../../domain/models/purchase';

export const DATABASE_NAME = 'artist-business-manager';
export const DATABASE_VERSION = 8;

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

export class AppDatabase extends Dexie {
  readonly fairs!: Table<FairEdition, string>;
  readonly fairSeries!: Table<FairSeries, string>;
  readonly fairEditions!: Table<FairEdition, string>;
  readonly operations!: Table<Operation, string>;
  readonly parties!: Table<Party, string>;
  readonly products!: Table<Product, string>;
  readonly purchases!: Table<Purchase, string>;

  constructor(databaseName = DATABASE_NAME) {
    super(databaseName);
    this.version(DATABASE_VERSION).stores({
      fairs: 'id, startDate, endDate, updatedAt, deletedAt',
      fairSeries: 'id, name, updatedAt, deletedAt',
      fairEditions: 'id, fairSeriesId, edition, year, startDate, endDate, updatedAt, deletedAt',
      operations: 'id, type, partyId, fairEditionId, updatedAt, deletedAt',
      parties: 'id, type, displayName, email, updatedAt, deletedAt',
      products: 'id, name, active, lotId, updatedAt, deletedAt',
      purchases: 'id, supplierId, purchaseDate, productId, lotId, updatedAt, deletedAt',
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
  }

  async openDatabase(): Promise<void> {
    await this.open();
  }
}
