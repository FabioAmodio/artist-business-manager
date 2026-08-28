export type PersistenceSource = 'none' | 'file-system' | 'google-drive';

export interface PersistenceSettings {
  readonly id: 'current';
  readonly source: PersistenceSource;
  readonly directoryHandle?: FileSystemDirectoryHandle;
  readonly driveFolderId?: string;
  readonly driveClientId?: string;
  readonly updatedAt: string;
}

export interface PersistedDataset {
  readonly format: 'artist-business-manager';
  readonly version: 1;
  readonly exportedAt: string;
  readonly collections: Readonly<Record<string, readonly Record<string, unknown>[]>>;
}
