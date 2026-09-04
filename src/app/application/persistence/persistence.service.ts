import { Injectable, effect, inject, signal } from '@angular/core';
import { APP_ENVIRONMENT, STORAGE_PROVIDER } from '../../core/configuration/environment.tokens';
import type { IStorageProvider } from '../../core/storage/storage-provider';
import type { PersistedDataset, PersistenceMode, PersistenceSettings } from '../../core/persistence/persistence.models';
import { SyncStatusService } from '../../core/synchronization/sync-status.service';
import { PaymentMethodService } from '../payment-methods/payment-method.service';
import { ServiceService } from '../services/service.service';
import type { SyncOperation } from '../../domain/models/sync-operation';
import { IndexedDbProvider } from '../../core/storage/indexed-db.provider';
import { WorkspaceService } from '../../core/firebase/workspace.service';
import { FirebaseAuthService } from '../../core/firebase/firebase-auth.service';

const SETTINGS_COLLECTION = 'appSettings';
const SETTINGS_ID = 'current';
const TEST_DATASET_INITIALIZED_ID = 'test-dataset-initialized';
const DATA_FILE_NAME = 'artist-business-manager-data.json';
const DATA_COLLECTIONS = ['bundles', 'fairs', 'fairSeries', 'fairEditions', 'lots', 'operations', 'paymentMethods', 'payments', 'parties', 'products', 'purchases', 'services'];
const SYSTEM_COLLECTIONS = new Set(['paymentMethods', 'services']);
const SYNC_OPERATIONS_COLLECTION = 'syncOperations';
const DRIVE_FILE_MIME = 'application/json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

export interface FirestoreMergeResult {
  readonly created: number;
  readonly unchanged: number;
  readonly conflicts: number;
}

export interface DriveFolder { readonly id: string; readonly name: string; readonly shared?: boolean; }
interface GoogleTokenClient { requestAccessToken: (options?: { prompt?: string }) => void; }
interface GoogleApi { accounts: { oauth2: { initTokenClient: (config: { client_id: string; scope: string; callback: (response: { access_token?: string; expires_in?: number; error?: string }) => void }) => GoogleTokenClient } } }

@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private readonly environment = inject(APP_ENVIRONMENT);
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);
  private readonly syncStatus = inject(SyncStatusService);
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly serviceService = inject(ServiceService);
  private readonly offlineStorage = inject(IndexedDbProvider, { optional: true });
  private readonly workspace = inject(WorkspaceService);
  private readonly firebaseAuth = inject(FirebaseAuthService);
  readonly mode = signal<PersistenceMode>(this.environment.defaultPersistenceMode);
  readonly source = signal<PersistenceSettings['source']>('none');
  readonly isDemoEnvironment = Boolean(this.environment.demoDatasetUrl);
  readonly status = signal('');
  readonly driveFolders = signal<readonly DriveFolder[]>([]);
  readonly driveFolderPath = signal<readonly DriveFolder[]>([]);
  readonly driveConfigured = Boolean(this.environment.googleDriveClientId?.trim());
  readonly driveNeedsAuthentication = signal(false);
  readonly pendingSyncOperations = signal<readonly SyncOperation[]>([]);
  private directoryHandle: FileSystemDirectoryHandle | undefined;
  private driveAccessToken: string | undefined;
  private driveAccessTokenExpiresAt = 0;
  private driveClientId = '';
  private initialized = false;
  private syncTimer: ReturnType<typeof setTimeout> | undefined;
  private synchronizePromise: Promise<void> | undefined;
  private driveReadModifiedTime: string | undefined;

  constructor() {
    effect(() => {
      this.syncStatus.changeVersion();
      if (this.initialized && this.source() !== 'none') this.scheduleAutomaticSync();
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.scheduleAutomaticSync());
      window.addEventListener('focus', () => this.scheduleAutomaticSync());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.scheduleAutomaticSync();
      });
    }
  }

  async initialize(): Promise<void> {
    const settings = await this.storage.get<PersistenceSettings>(SETTINGS_COLLECTION, SETTINGS_ID);
    this.mode.set(settings?.mode ?? this.environment.defaultPersistenceMode);
    this.storage.setMode?.(this.mode());
    this.source.set(this.environment.environmentName === 'release' || this.isDemoEnvironment ? 'none' : settings?.source ?? 'none');
    this.directoryHandle = this.environment.environmentName === 'release' || this.isDemoEnvironment ? undefined : settings?.directoryHandle;
    this.driveClientId = this.environment.environmentName === 'release' ? '' : settings?.driveClientId ?? this.environment.googleDriveClientId ?? '';
    this.driveFolderId = this.environment.environmentName === 'release' || this.isDemoEnvironment ? undefined : settings?.driveFolderId;
    await this.initializeTestDataset();
    this.initialized = true;
    this.syncStatus.setStatus(this.source() === 'none' ? 'local-only' : 'synced');
    await this.refreshSyncOperations();
    if (this.source() === 'google-drive' && this.driveFolderId && this.driveClientId) {
      void this.restoreDriveSession();
    }
  }

  async setMode(mode: PersistenceMode): Promise<void> {
    if (mode === 'firestore') {
      await this.storage.put(SETTINGS_COLLECTION, {
        id: SETTINGS_ID,
        mode,
        source: 'none',
        updatedAt: new Date().toISOString(),
      } satisfies PersistenceSettings);
      this.storage.setMode?.(mode);
      this.mode.set(mode);
      this.source.set('none');
      this.firebaseAuth.start();
      this.status.set('Firebase selezionato. Accedi per utilizzare il workspace remoto.');
      return;
    }
    await this.disable();
    this.storage.setMode?.('offline');
    this.mode.set('offline');
  }

  async seedFirestoreFromOffline(): Promise<void> {
    if (this.mode() !== 'firestore') throw new Error('Seleziona prima la modalità Firebase.');
    if (!this.offlineStorage) throw new Error('Database locale non disponibile.');
    const remoteRecords = (await Promise.all(DATA_COLLECTIONS.map(async (collection) => {
      const records = await this.storage.list<Record<string, unknown>>(collection);
      return SYSTEM_COLLECTIONS.has(collection) ? records.filter((record) => record['system'] !== true) : records;
    }))).flat();
    if (remoteRecords.length) throw new Error('Il workspace Firebase contiene già dati. Il caricamento iniziale è consentito solo su un workspace vuoto.');
    const localDataset = await this.readDataset(this.offlineStorage);
    for (const collection of DATA_COLLECTIONS) {
      for (const record of localDataset.collections[collection] ?? []) await this.storage.put(collection, record);
    }
    this.status.set('Dati locali copiati nel workspace Firebase.');
  }

  async mergeOfflineIntoFirestore(): Promise<FirestoreMergeResult> {
    if (this.mode() !== 'firestore') throw new Error('Seleziona prima la modalità Firebase.');
    if (!this.offlineStorage) throw new Error('Database locale non disponibile.');
    const localDataset = await this.readDataset(this.offlineStorage);
    for (const collection of DATA_COLLECTIONS) {
      const invalidIndex = (localDataset.collections[collection] ?? []).findIndex((record) => !record['id']);
      if (invalidIndex >= 0) throw new Error(`Record senza id nella collection ${collection}, posizione ${invalidIndex + 1}. Correggi il file importato e riprova.`);
    }
    let created = 0;
    let unchanged = 0;
    let conflicts = 0;
    for (const collection of DATA_COLLECTIONS) {
      const [localRecords, remoteRecords] = await Promise.all([
        this.offlineStorage.list<Record<string, unknown>>(collection),
        this.storage.list<Record<string, unknown>>(collection),
      ]);
      const remoteById = new Map(remoteRecords.map((record) => [String(record['id']), record]));
      for (const localRecord of localDataset.collections[collection] ?? []) {
        const remoteRecord = remoteById.get(String(localRecord['id']));
        if (!remoteRecord) {
          await this.storage.put(collection, localRecord);
          created += 1;
        } else if (this.sameData(localRecord, remoteRecord)) {
          unchanged += 1;
        } else {
          conflicts += 1;
        }
      }
    }
    const result: FirestoreMergeResult = { created, unchanged, conflicts };
    this.status.set(`Merge completato: ${result.created} creati, ${result.unchanged} invariati, ${result.conflicts} conflitti non sovrascritti.`);
    return result;
  }

  async resetFirestoreWorkspace(): Promise<number> {
    if (this.mode() !== 'firestore') throw new Error('Seleziona prima la modalità Firebase.');
    if (this.environment.environmentName === 'release' && !this.workspace.isActiveOwner()) throw new Error('Solo il proprietario del workspace può eseguire il ripristino remoto PROD.');
    const backup = await this.readDataset(this.storage);
    if (this.environment.environmentName === 'release') this.downloadDataset(backup, 'artist-business-manager-firestore-backup.json');
    let deleted = 0;
    for (const collection of DATA_COLLECTIONS) {
      const records = await this.storage.list<Record<string, unknown>>(collection);
      const removable = records.filter((record) => !(SYSTEM_COLLECTIONS.has(collection) && record['system'] === true));
      for (const record of removable) {
        await this.storage.deletePermanent(collection, String(record['id']));
        deleted += 1;
      }
    }
    if (this.environment.demoDatasetUrl) {
      const demoDataset = await this.readDemoDataset();
      await this.writeLocalDataset(this.storage, demoDataset);
    } else {
      await Promise.all([this.paymentMethodService.list(), this.serviceService.list()]);
    }
    this.status.set(`Ripristino remoto completato: ${deleted} record rimossi e dati iniziali ripristinati.`);
    return deleted;
  }

  private async restoreDriveSession(): Promise<void> {
    try {
      await this.authorizeDrive(false);
      this.driveNeedsAuthentication.set(false);
      await this.synchronize();
    } catch {
      this.driveNeedsAuthentication.set(true);
      this.status.set('Ricollega Google Drive per sincronizzare.');
    }
  }

  async chooseFileSystem(): Promise<void> {
    this.ensureExternalPersistenceAllowed();
    const picker = (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
    if (!picker) throw new Error('La selezione diretta della cartella non e supportata da questo browser. Usa importa/esporta file.');
    this.directoryHandle = await picker();
    await this.saveSettings('file-system', this.directoryHandle);
    await this.synchronize();
  }

  async connectDrive(): Promise<void> {
    this.ensureExternalPersistenceAllowed();
    this.driveClientId = this.environment.googleDriveClientId?.trim() ?? '';
    if (!this.driveClientId) throw new Error('Inserisci il Google OAuth Client ID.');
    await this.authorizeDrive(true);
    this.driveNeedsAuthentication.set(false);
    this.driveFolders.set(await this.listDriveRootFolders());
    await this.saveSettings('google-drive', undefined, undefined, this.driveClientId);
    this.status.set('Account Google collegato. Seleziona una cartella.');
  }

  async selectDriveFolder(folderId: string): Promise<void> {
    this.ensureExternalPersistenceAllowed();
    if (!folderId) throw new Error('Seleziona una cartella Drive.');
    await this.saveSettings('google-drive', undefined, folderId, this.driveClientId);
    await this.synchronize();
  }

  async browseDriveFolder(folder: DriveFolder): Promise<void> {
    this.ensureExternalPersistenceAllowed();
    this.driveFolderPath.update((path) => [...path, folder]);
    this.driveFolders.set(await this.listDriveFolders(folder.id));
  }

  async browseDriveRoot(): Promise<void> {
    this.ensureExternalPersistenceAllowed();
    this.driveFolderPath.set([]);
    this.driveFolders.set(await this.listDriveRootFolders());
  }

  async browseDrivePath(folder: DriveFolder): Promise<void> {
    this.ensureExternalPersistenceAllowed();
    const path = this.driveFolderPath();
    const index = path.findIndex((item) => item.id === folder.id);
    this.driveFolderPath.set(index < 0 ? [] : path.slice(0, index + 1));
    this.driveFolders.set(await this.listDriveFolders(folder.id));
  }

  async createDriveFolder(name: string): Promise<void> {
    this.ensureExternalPersistenceAllowed();
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Inserisci il nome della cartella Drive.');
    const parentId = this.driveFolderPath().at(-1)?.id ?? 'root';
    const response = await this.driveFetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmedName, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }),
    });
    const folder = await response.json() as DriveFolder;
    this.driveFolders.set(await (parentId === 'root' ? this.listDriveRootFolders() : this.listDriveFolders(parentId)));
    this.status.set(`Cartella "${folder.name}" creata. Selezionala con Usa.`);
  }

  async disable(): Promise<void> {
    this.directoryHandle = undefined;
    await this.saveSettings('none');
    this.status.set('Nessuna sorgente persistente configurata.');
  }

  async factoryReset(): Promise<void> {
    if (!this.offlineStorage) throw new Error('Database locale non disponibile.');
    await this.syncStatus.suppress(async () => {
      this.storage.setMode?.('offline');
      await this.offlineStorage!.clearCollections([...DATA_COLLECTIONS, SYNC_OPERATIONS_COLLECTION, SETTINGS_COLLECTION]);
      if (this.environment.demoDatasetUrl) {
        await this.writeLocalDataset(this.offlineStorage!, await this.readDemoDataset());
        await this.offlineStorage!.put(SETTINGS_COLLECTION, { id: TEST_DATASET_INITIALIZED_ID, source: 'test-dataset', updatedAt: new Date().toISOString() });
        return;
      }
      await this.offlineStorage!.put(SETTINGS_COLLECTION, { id: SETTINGS_ID, source: 'none', updatedAt: new Date().toISOString() } satisfies PersistenceSettings);
      await Promise.all([this.paymentMethodService.list(), this.serviceService.list()]);
    });
    this.mode.set('offline');
    this.source.set('none');
    this.syncStatus.setStatus('local-only');
    this.status.set('Database locale ripristinato alle impostazioni di fabbrica.');
  }

  private async initializeTestDataset(): Promise<void> {
    if (!this.environment.demoDatasetUrl) return;
    const initialized = await this.storage.get<{ id: string }>(SETTINGS_COLLECTION, TEST_DATASET_INITIALIZED_ID);
    if (initialized) return;
    await this.syncStatus.suppress(async () => {
      await this.storage.clearCollections([...DATA_COLLECTIONS, SYNC_OPERATIONS_COLLECTION, SETTINGS_COLLECTION]);
      await this.writeLocalDataset(this.storage, await this.readDemoDataset());
      await this.storage.put(SETTINGS_COLLECTION, { id: TEST_DATASET_INITIALIZED_ID, source: 'test-dataset', updatedAt: new Date().toISOString() });
    });
  }

  private async readDemoDataset(): Promise<PersistedDataset> {
    const response = await fetch(new URL(this.environment.demoDatasetUrl!, document.baseURI));
    if (!response.ok) throw new Error('Impossibile caricare il dataset demo.');
    return this.parseDataset(await response.text());
  }

  async synchronize(): Promise<void> {
    if (this.synchronizePromise) return this.synchronizePromise;
    this.synchronizePromise = this.synchronizeInternalWithStatus();
    try {
      await this.synchronizePromise;
    } finally {
      this.synchronizePromise = undefined;
    }
  }

  async retrySyncOperation(id: string): Promise<void> {
    const operation = await this.storage.get<SyncOperation>(SYNC_OPERATIONS_COLLECTION, id);
    if (!operation) return;
    await this.storage.put(SYNC_OPERATIONS_COLLECTION, { ...operation, status: 'pending', errorMessage: undefined, updatedAt: new Date().toISOString() });
    if (operation.after) await this.syncStatus.suppress(() => this.storage.put(operation.collection, operation.after));
    await this.refreshSyncOperations();
    this.scheduleAutomaticSync();
  }

  async discardSyncOperation(id: string): Promise<void> {
    await this.storage.deletePermanent(SYNC_OPERATIONS_COLLECTION, id);
    await this.refreshSyncOperations();
  }

  private async synchronizeInternalWithStatus(): Promise<void> {
    this.ensureCapabilityAllowed('allowCloudSync');
    this.syncStatus.setStatus('syncing');
    try {
      await this.synchronizeInternal();
      this.syncStatus.setStatus(this.source() === 'none' ? 'local-only' : 'synced');
      this.syncStatus.notifySyncCompleted();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore applicativo di sincronizzazione.';
      if (this.isConflictError(error)) await this.markPendingAsConflict(errorMessage);
      else if (this.isPermanentSyncError(error)) await this.markPendingAsError(errorMessage);
      await this.refreshSyncOperations();
      this.syncStatus.setStatus('error');
      throw error;
    }
  }

  private async synchronizeInternal(): Promise<void> {
    const local = await this.readLocalDataset();
    const remote = this.source() === 'file-system'
      ? await this.readDirectoryDataset()
      : this.source() === 'google-drive' ? await this.readDriveDataset() : null;
    if (this.source() === 'file-system' && !this.directoryHandle) throw new Error('La cartella persistente non e disponibile. Selezionala nuovamente.');
    if (this.source() === 'google-drive' && !this.getDriveFolderId()) throw new Error('Seleziona prima una cartella Drive.');
    if (remote && this.source() === 'google-drive') await this.createDailyDriveBackup(remote);
    const merged = remote ? await this.mergePendingChanges(this.merge(local, remote), remote) : local;
    await this.syncStatus.suppress(() => this.writeLocalDataset(this.storage, merged));
    if (this.source() === 'file-system') await this.writeDirectoryDataset(merged);
    if (this.source() === 'google-drive') await this.writeDriveDataset(merged);
    await this.acknowledgePendingChanges(remote, merged);
    await this.refreshSyncOperations();
    this.status.set(remote ? 'Dati locali e persistenti allineati.' : 'Dati locali copiati nella cartella persistente.');
  }

  private scheduleAutomaticSync(): void {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncTimer = undefined;
      void this.synchronize().catch(() => undefined);
    }, 750);
  }

  async exportLocal(): Promise<void> {
    this.ensureCapabilityAllowed('allowImportExport');
    const dataset = await this.readLocalDataset();
    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = DATA_FILE_NAME;
    anchor.click();
    URL.revokeObjectURL(url);
    this.status.set('Esportazione preparata.');
  }

  async importFile(file: File): Promise<void> {
    this.ensureCapabilityAllowed('allowImportExport');
    const dataset = this.parseDataset(await file.text());
    await this.writeLocalDataset(this.storage, this.merge(await this.readLocalDataset(), dataset));
    this.status.set('Dati importati nel database locale.');
  }

  async persistImportedFile(file: File): Promise<void> {
    this.ensureCapabilityAllowed('allowImportExport');
    const dataset = this.parseDataset(await file.text());
    await this.writeLocalDataset(this.storage, this.merge(await this.readLocalDataset(), dataset));
    if (this.source() === 'file-system' && this.directoryHandle) await this.writeDirectoryDataset(await this.readLocalDataset());
    this.status.set('Dati importati e allineati.');
  }

  private async authorizeDrive(interactive = false): Promise<void> {
    await this.loadGoogleIdentityServices();
    const google = (window as Window & { google?: GoogleApi }).google;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Autenticazione Google Drive scaduta. Riprova.')), 30_000);
      const client = google!.accounts.oauth2.initTokenClient({ client_id: this.driveClientId, scope: DRIVE_SCOPE, callback: (response) => {
        clearTimeout(timeout);
        if (response.error || !response.access_token) reject(new Error('Autenticazione Google non riuscita.'));
        else { this.driveAccessToken = response.access_token; this.driveAccessTokenExpiresAt = Date.now() + (response.expires_in ?? 3600) * 1000; resolve(); }
      } });
      client.requestAccessToken({ prompt: interactive ? 'consent' : 'none' });
    });
  }

  private ensureExternalPersistenceAllowed(): void {
    this.ensureCapabilityAllowed('allowExternalPersistence');
  }

  private ensureCapabilityAllowed(capability: 'allowExternalPersistence' | 'allowImportExport' | 'allowCloudSync'): void {
    if (!this.environment[capability]) throw new Error(`Questa funzione non e disponibile nell'ambiente ${this.environment.environmentName.toUpperCase()}.`);
  }

  private async listDriveFolders(parentId: string): Promise<readonly DriveFolder[]> {
    const query = new URLSearchParams({ q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, fields: 'files(id,name)', orderBy: 'name', pageSize: '1000', includeItemsFromAllDrives: 'true', supportsAllDrives: 'true', corpora: 'user' });
    const response = await this.driveFetch(`https://www.googleapis.com/drive/v3/files?${query}`);
    const data = await response.json() as { files?: DriveFolder[] };
    return data.files ?? [];
  }

  private async listSharedDriveFolders(): Promise<readonly DriveFolder[]> {
    const query = new URLSearchParams({ q: `sharedWithMe = true and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, fields: 'files(id,name)', orderBy: 'name', pageSize: '1000', includeItemsFromAllDrives: 'true', supportsAllDrives: 'true', corpora: 'user' });
    const response = await this.driveFetch(`https://www.googleapis.com/drive/v3/files?${query}`);
    const data = await response.json() as { files?: DriveFolder[] };
    return (data.files ?? []).map((folder) => ({ ...folder, shared: true }));
  }

  private async listDriveRootFolders(): Promise<readonly DriveFolder[]> {
    const [owned, shared] = await Promise.all([this.listDriveFolders('root'), this.listSharedDriveFolders()]);
    const folders = new Map<string, DriveFolder>();
    for (const folder of [...owned, ...shared]) folders.set(folder.id, folder);
    return [...folders.values()].sort((first, second) => first.name.localeCompare(second.name));
  }

  private async readDriveDataset(): Promise<PersistedDataset | null> {
    const folderId = this.getDriveFolderId();
    const response = await this.driveFetch(`https://www.googleapis.com/drive/v3/files?${new URLSearchParams({ q: `'${folderId}' in parents and name = '${DATA_FILE_NAME}' and trashed = false`, fields: 'files(id,modifiedTime)', orderBy: 'modifiedTime desc', pageSize: '1' })}`);
    const data = await response.json() as { files?: Array<{ id: string; modifiedTime?: string }> };
    if (!data.files?.length) return null;
    this.driveReadModifiedTime = data.files[0].modifiedTime;
    return this.parseDataset(await (await this.driveFetch(`https://www.googleapis.com/drive/v3/files/${data.files[0].id}?alt=media`)).text());
  }

  private async writeDriveDataset(dataset: PersistedDataset): Promise<void> {
    const folderId = this.getDriveFolderId();
    const search = await this.driveFetch(`https://www.googleapis.com/drive/v3/files?${new URLSearchParams({ q: `'${folderId}' in parents and name = '${DATA_FILE_NAME}' and trashed = false`, fields: 'files(id,modifiedTime)', pageSize: '1' })}`);
    const files = await search.json() as { files?: Array<{ id: string; modifiedTime?: string }> };
    const metadata = JSON.stringify(files.files?.[0]
      ? { name: DATA_FILE_NAME, mimeType: DRIVE_FILE_MIME }
      : { name: DATA_FILE_NAME, mimeType: DRIVE_FILE_MIME, parents: [folderId] });
    if (files.files?.[0]?.modifiedTime && this.driveReadModifiedTime && files.files[0].modifiedTime !== this.driveReadModifiedTime) {
      throw new Error('Il file Drive è cambiato su un altro dispositivo durante la sincronizzazione. Riprova.');
    }
    const body = JSON.stringify(dataset);
    const url = files.files?.[0] ? `https://www.googleapis.com/upload/drive/v3/files/${files.files[0].id}?uploadType=multipart` : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const boundary = `abm-${Date.now()}`;
    const payload = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${DRIVE_FILE_MIME}\r\n\r\n${body}\r\n--${boundary}--`;
    await this.driveFetch(url, { method: files.files?.[0] ? 'PATCH' : 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: payload });
  }

  private async createDailyDriveBackup(dataset: PersistedDataset): Promise<void> {
    const folderId = this.getDriveFolderId();
    if (!folderId) return;
    const date = new Date().toISOString().slice(0, 10);
    const name = `artist-business-manager-data-backup-${date}.json`;
    const search = await this.driveFetch(`https://www.googleapis.com/drive/v3/files?${new URLSearchParams({ q: `'${folderId}' in parents and name = '${name}' and trashed = false`, fields: 'files(id)', pageSize: '1' })}`);
    const files = await search.json() as { files?: Array<{ id: string }> };
    if (files.files?.length) return;
    const metadata = JSON.stringify({ name, mimeType: DRIVE_FILE_MIME, parents: [folderId] });
    const boundary = `abm-backup-${Date.now()}`;
    const payload = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${DRIVE_FILE_MIME}\r\n\r\n${JSON.stringify(dataset)}\r\n--${boundary}--`;
    await this.driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: payload });
  }

  private async mergePendingChanges(merged: PersistedDataset, remote: PersistedDataset): Promise<PersistedDataset> {
    const pending = (await this.storage.list<SyncOperation>(SYNC_OPERATIONS_COLLECTION)).filter((operation) => operation.status === 'pending');
    const collections = Object.fromEntries(Object.entries(merged.collections).map(([collection, records]) => [collection, [...records]])) as Record<string, Record<string, unknown>[]>;
    for (const operation of pending) {
      const remoteRecord = (remote.collections[operation.collection] ?? []).find((record) => String(record['id']) === operation.entityId);
      const remoteUpdatedAt = String(remoteRecord?.['updatedAt'] ?? remoteRecord?.['createdAt'] ?? '');
      const baseUpdatedAt = String(operation.before?.['updatedAt'] ?? operation.before?.['createdAt'] ?? '');
      if (remoteRecord && remoteUpdatedAt > baseUpdatedAt && JSON.stringify(remoteRecord) !== JSON.stringify(operation.after)) {
        await this.markSyncOperation(operation, 'conflict', 'Il record è stato modificato anche su un altro dispositivo.');
        continue;
      }
      const records = collections[operation.collection] ?? [];
      const index = records.findIndex((record) => String(record['id']) === operation.entityId);
      if (operation.after) {
        if (index >= 0) records[index] = operation.after;
        else records.push(operation.after);
      }
      collections[operation.collection] = records;
    }
    return { ...merged, collections };
  }

  private async acknowledgePendingChanges(remote: PersistedDataset | null, merged: PersistedDataset): Promise<void> {
    const pending = (await this.storage.list<SyncOperation>(SYNC_OPERATIONS_COLLECTION)).filter((operation) => operation.status === 'pending');
    for (const operation of pending) {
      const localRecord = (merged.collections[operation.collection] ?? []).find((record) => String(record['id']) === operation.entityId);
      if (JSON.stringify(localRecord) === JSON.stringify(operation.after)) await this.storage.deletePermanent(SYNC_OPERATIONS_COLLECTION, operation.id);
    }
  }

  private async markSyncOperation(operation: SyncOperation, status: SyncOperation['status'], errorMessage: string): Promise<void> {
    await this.storage.put(SYNC_OPERATIONS_COLLECTION, { ...operation, status, errorMessage, updatedAt: new Date().toISOString() });
  }

  private async markPendingAsError(errorMessage: string): Promise<void> {
    const pending = (await this.storage.list<SyncOperation>(SYNC_OPERATIONS_COLLECTION)).filter((operation) => operation.status === 'pending');
    for (const operation of pending) await this.markSyncOperation(operation, 'error', errorMessage);
  }

  private async markPendingAsConflict(errorMessage: string): Promise<void> {
    const pending = (await this.storage.list<SyncOperation>(SYNC_OPERATIONS_COLLECTION)).filter((operation) => operation.status === 'pending');
    for (const operation of pending) await this.markSyncOperation(operation, 'conflict', errorMessage);
  }

  private isPermanentSyncError(error: unknown): boolean {
    return error instanceof Error && /^Google Drive ha restituito 4\d\d/.test(error.message);
  }

  private isConflictError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('file Drive è cambiato su un altro dispositivo');
  }

  private async refreshSyncOperations(): Promise<void> {
    this.pendingSyncOperations.set(await this.storage.list<SyncOperation>(SYNC_OPERATIONS_COLLECTION));
  }

  private async driveFetch(input: string, init: RequestInit = {}): Promise<Response> {
    if (!this.driveAccessToken || Date.now() >= this.driveAccessTokenExpiresAt - 60_000) await this.authorizeDrive(false);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(input, { ...init, signal: controller.signal, headers: { Authorization: `Bearer ${this.driveAccessToken}`, ...(init.headers ?? {}) } });
      if (!response.ok) {
        let detail = '';
        try {
          const error = await response.json() as { error?: { message?: string; errors?: Array<{ reason?: string }> } };
          detail = error.error?.message ?? error.error?.errors?.[0]?.reason ?? '';
        } catch { detail = ''; }
        throw new Error(`Google Drive ha restituito ${response.status}${detail ? `: ${detail}` : '.'}`);
      }
      return response;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw new Error('La sincronizzazione Google Drive ha superato il limite di 30 secondi. Riprova.');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async loadGoogleIdentityServices(): Promise<void> {
    if ((window as Window & { google?: GoogleApi }).google) return;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.onload = () => resolve(); script.onerror = () => reject(new Error('Impossibile caricare l\'autenticazione Google.')); document.head.appendChild(script);
    });
  }

  private getDriveFolderId(): string | undefined { return this.driveFolderId; }

  private async readLocalDataset(): Promise<PersistedDataset> {
    return this.readDataset(this.storage);
  }

  private async readDataset(provider: IStorageProvider): Promise<PersistedDataset> {
    const collections: Record<string, readonly Record<string, unknown>[]> = {};
    for (const collection of DATA_COLLECTIONS) collections[collection] = await provider.list<Record<string, unknown>>(collection);
    return this.repairDatasetIds({ format: 'artist-business-manager', version: 1, exportedAt: new Date().toISOString(), collections });
  }

  private sameData(first: Record<string, unknown>, second: Record<string, unknown>): boolean {
    const ignoredFields = new Set(['createdBy', 'updatedBy', 'version']);
    const normalize = (record: Record<string, unknown>) => Object.fromEntries(Object.entries(record).filter(([key]) => !ignoredFields.has(key)));
    return JSON.stringify(normalize(first)) === JSON.stringify(normalize(second));
  }

  private async writeLocalDataset(provider: IStorageProvider, dataset: PersistedDataset): Promise<void> {
    for (const collection of DATA_COLLECTIONS) for (const record of dataset.collections[collection] ?? []) await provider.put(collection, record);
  }

  private downloadDataset(dataset: PersistedDataset, fileName: string): void {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private async readDirectoryDataset(): Promise<PersistedDataset | null> {
    try {
      const fileHandle = await this.directoryHandle!.getFileHandle(DATA_FILE_NAME);
      return this.parseDataset(await (await fileHandle.getFile()).text());
    } catch { return null; }
  }

  private async writeDirectoryDataset(dataset: PersistedDataset): Promise<void> {
    const fileHandle = await this.directoryHandle!.getFileHandle(DATA_FILE_NAME, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(dataset, null, 2));
    await writable.close();
  }

  private merge(local: PersistedDataset, remote: PersistedDataset): PersistedDataset {
    const collections: Record<string, readonly Record<string, unknown>[]> = {};
    for (const collection of DATA_COLLECTIONS) {
      const records = new Map<string, Record<string, unknown>>();
      for (const record of [...(local.collections[collection] ?? []), ...(remote.collections[collection] ?? [])]) {
        const id = String(record['id']);
        const current = records.get(id);
        const currentTime = String(current?.['updatedAt'] ?? current?.['createdAt'] ?? '');
        const recordTime = String(record['updatedAt'] ?? record['createdAt'] ?? '');
        if (!current || recordTime >= currentTime) records.set(id, record);
      }
      collections[collection] = [...records.values()];
    }
    return { format: 'artist-business-manager', version: 1, exportedAt: new Date().toISOString(), collections };
  }

  private parseDataset(value: string): PersistedDataset {
    const parsed = JSON.parse(value) as Partial<PersistedDataset>;
    if (parsed.format !== 'artist-business-manager' || parsed.version !== 1 || !parsed.collections) throw new Error('File dati non valido.');
    return this.repairDatasetIds(parsed as PersistedDataset);
  }

  private repairDatasetIds(dataset: PersistedDataset): PersistedDataset {
    const collections: Record<string, readonly Record<string, unknown>[]> = {};
    for (const [collection, records] of Object.entries(dataset.collections)) {
      collections[collection] = records.map((record, index) => ({
        ...record,
        id: record['id'] || `legacy-${collection}-${index + 1}-${this.stableRecordHash(record)}`,
      }));
    }
    return { ...dataset, collections };
  }

  private stableRecordHash(record: Record<string, unknown>): string {
    let hash = 0;
    for (const character of JSON.stringify(record)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return hash.toString(36);
  }

  private driveFolderId: string | undefined;

  private async saveSettings(source: PersistenceSettings['source'], directoryHandle?: FileSystemDirectoryHandle, driveFolderId?: string, driveClientId?: string): Promise<void> {
    this.driveFolderId = driveFolderId ?? (source === 'google-drive' ? this.driveFolderId : undefined);
    await this.storage.put(SETTINGS_COLLECTION, { id: SETTINGS_ID, source, directoryHandle, driveFolderId: this.driveFolderId, driveClientId: driveClientId ?? this.driveClientId, updatedAt: new Date().toISOString() });
    this.source.set(source);
  }
}
