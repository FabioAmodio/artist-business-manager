import Dexie, { type Table } from 'dexie';
import type { Fair } from '../../domain/models/fair';

export const DATABASE_NAME = 'artist-business-manager';
export const DATABASE_VERSION = 2;

export class AppDatabase extends Dexie {
  readonly fairs!: Table<Fair, string>;

  constructor(databaseName = DATABASE_NAME) {
    super(databaseName);
    this.version(DATABASE_VERSION).stores({
      fairs: 'id, startDate, endDate, updatedAt, deletedAt',
    });
  }

  async openDatabase(): Promise<void> {
    await this.open();
  }
}
