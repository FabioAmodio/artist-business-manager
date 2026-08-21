import Dexie, { type Table } from 'dexie';

export const DATABASE_NAME = 'artist-business-manager';
export const DATABASE_VERSION = 1;

export class AppDatabase extends Dexie {
  readonly placeholder!: Table<never, string>;

  constructor() {
    super(DATABASE_NAME);
    this.version(DATABASE_VERSION).stores({});
  }

  async openDatabase(): Promise<void> {
    await this.open();
  }
}
