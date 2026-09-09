export type PersistenceMode = 'offline' | 'firestore';
export type PersistenceSource = 'none' | 'file-system' | 'google-drive';
export type ListInteractionMode = 'swipe' | 'buttons';

export interface PersistenceSettings {
  readonly id: 'current';
  readonly mode?: PersistenceMode;
  readonly source: PersistenceSource;
  readonly directoryHandle?: FileSystemDirectoryHandle;
  readonly driveFolderId?: string;
  readonly driveClientId?: string;
  readonly listInteractionMode?: ListInteractionMode;
  readonly dueSoonDays?: number;
  readonly catalogUsageFairCount?: number;
  readonly updatedAt: string;
}

export interface PersistedDataset {
  readonly format: 'artist-business-manager';
  readonly version: 1;
  readonly exportedAt: string;
  readonly collections: Readonly<Record<string, readonly Record<string, unknown>[]>>;
}
