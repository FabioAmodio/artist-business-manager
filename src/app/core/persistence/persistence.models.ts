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
  readonly notificationsStale?: boolean;
  // Per-dispositivo, non sincronizzato: ogni installazione puo avere un intervallo diverso.
  readonly firestoreFullSyncIntervalMinutes?: number;
  // Per-dispositivo, non sincronizzato: tempo massimo di attesa all'avvio prima di procedere coi soli dati locali.
  readonly firestoreBootstrapTimeoutSeconds?: number;
  readonly updatedAt: string;
}

export interface PersistedDataset {
  readonly format: 'artist-business-manager';
  readonly version: 1;
  readonly exportedAt: string;
  readonly collections: Readonly<Record<string, readonly Record<string, unknown>[]>>;
}
