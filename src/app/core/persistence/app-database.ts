import Dexie, { type Table } from 'dexie';
import type { FairEdition, FairSeries } from '../../domain/models/fair';

export const DATABASE_NAME = 'artist-business-manager';
export const DATABASE_VERSION = 3;

interface LegacyFair {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly notes?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt?: string;
}

export class AppDatabase extends Dexie {
  readonly fairs!: Table<FairEdition, string>;
  readonly fairSeries!: Table<FairSeries, string>;
  readonly fairEditions!: Table<FairEdition, string>;

  constructor(databaseName = DATABASE_NAME) {
    super(databaseName);
    this.version(DATABASE_VERSION).stores({
      fairs: 'id, startDate, endDate, updatedAt, deletedAt',
      fairSeries: 'id, name, updatedAt, deletedAt',
      fairEditions: 'id, fairSeriesId, edition, year, startDate, endDate, updatedAt, deletedAt',
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
