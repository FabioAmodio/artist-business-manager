import type { EntityId, IsoDateTime } from '../../domain/shared/types';
import type { StorageError } from './storage-errors';

export interface StorageHealth {
  readonly available: boolean;
  readonly provider: string;
  readonly databaseName: string;
  readonly schemaVersion: number;
  readonly migrationVersion: number;
  readonly error?: StorageError;
  readonly checkedAt: IsoDateTime;
}

export interface StorageFilter {
  readonly field: string;
  readonly value: unknown;
}

export interface DeleteMetadata {
  readonly deletedAt?: IsoDateTime;
  readonly deletedBy?: EntityId;
}

export interface IStorageProvider {
  open(): Promise<void>;
  close(): Promise<void>;
  get<T>(collection: string, id: EntityId): Promise<T | null>;
  list<T>(collection: string, filter?: StorageFilter): Promise<readonly T[]>;
  put<T>(collection: string, value: T): Promise<void>;
  deleteLogical(collection: string, id: EntityId, metadata?: DeleteMetadata): Promise<void>;
  deletePermanent(collection: string, id: EntityId): Promise<void>;
  clearCollections(collections: readonly string[]): Promise<void>;
  transaction<T>(collections: readonly string[], work: () => Promise<T>): Promise<T>;
  health(): Promise<StorageHealth>;
}
