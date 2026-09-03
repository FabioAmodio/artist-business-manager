import { Injectable, effect, inject, signal } from '@angular/core';
import { APP_ENVIRONMENT, STORAGE_PROVIDER } from '../../core/configuration/environment.tokens';
import type { IStorageProvider } from '../../core/storage/storage-provider';
import type { PersistedDataset, PersistenceSettings } from '../../core/persistence/persistence.models';
import { SyncStatusService } from '../../core/synchronization/sync-status.service';
import { PaymentMethodService } from '../payment-methods/payment-method.service';
import { ServiceService } from '../services/service.service';

const SETTINGS_COLLECTION = 'appSettings';
const SETTINGS_ID = 'current';
const TEST_DATASET_INITIALIZED_ID = 'test-dataset-initialized';
const DATA_FILE_NAME = 'artist-business-manager-data.json';
const DATA_COLLECTIONS = ['bundles', 'fairs', 'fairSeries', 'fairEditions', 'lots', 'operations', 'paymentMethods', 'payments', 'parties', 'products', 'purchases', 'services'];
const DRIVE_FILE_MIME = 'application/json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

export interface DriveFolder { readonly id: string; readonly name: string; }
interface GoogleTokenClient { requestAccessToken: (options?: { prompt?: string }) => void; }
interface GoogleApi { accounts: { oauth2: { initTokenClient: (config: { client_id: string; scope: string; callback: (response: { access_token?: string; expires_in?: number; error?: string }) => void }) => GoogleTokenClient } } }

@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private readonly environment = inject(APP_ENVIRONMENT);
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);
  private readonly syncStatus = inject(SyncStatusService);
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly serviceService = inject(ServiceService);
  readonly source = signal<PersistenceSettings['source']>('none');
  readonly isDemoEnvironment = Boolean(this.environment.demoDatasetUrl);
  readonly status = signal('');
  readonly driveFolders = signal<readonly DriveFolder[]>([]);
  readonly driveFolderPath = signal<readonly DriveFolder[]>([]);
  readonly driveConfigured = Boolean(this.environment.googleDriveClientId?.trim());
  readonly driveNeedsAuthentication = signal(false);
  private directoryHandle: FileSystemDirectoryHandle | undefined;
  private driveAccessToken: string | undefined;
  private driveAccessTokenExpiresAt = 0;
  private driveClientId = '';
  private initialized = false;
  private syncTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      this.syncStatus.changeVersion();
      if (this.initialized && this.source() !== 'none') this.scheduleAutomaticSync();
    });
    if (typeof window !== 'undefined') window.addEventListener('online', () => this.scheduleAutomaticSync());
  }

  async initialize(): Promise<void> {
    const settings = await this.storage.get<PersistenceSettings>(SETTINGS_COLLECTION, SETTINGS_ID);
    this.source.set(this.isDemoEnvironment ? 'none' : settings?.source ?? 'none');
    this.directoryHandle = this.isDemoEnvironment ? undefined : settings?.directoryHandle;
    this.driveClientId = settings?.driveClientId ?? this.environment.googleDriveClientId ?? '';
    this.driveFolderId = this.isDemoEnvironment ? undefined : settings?.driveFolderId;
    await this.initializeTestDataset();
    this.initialized = true;
    this.syncStatus.setStatus(this.source() === 'none' ? 'local-only' : 'synced');
    if (this.source() === 'google-drive' && this.driveFolderId && this.driveClientId) {
      void this.restoreDriveSession();
    }
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
    this.driveFolders.set(await this.listDriveFolders('root'));
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
    this.driveFolders.set(await this.listDriveFolders('root'));
  }

  async browseDrivePath(folder: DriveFolder): Promise<void> {
    this.ensureExternalPersistenceAllowed();
    const path = this.driveFolderPath();
    const index = path.findIndex((item) => item.id === folder.id);
    this.driveFolderPath.set(index < 0 ? [] : path.slice(0, index + 1));
    this.driveFolders.set(await this.listDriveFolders(folder.id));
  }

  async disable(): Promise<void> {
    this.directoryHandle = undefined;
    await this.saveSettings('none');
    this.status.set('Nessuna sorgente persistente configurata.');
  }

  async factoryReset(): Promise<void> {
    if (this.source() !== 'none') throw new Error('Il ripristino e consentito solo con sorgente dati Nessuna.');
    await this.syncStatus.suppress(async () => {
      await this.storage.clearCollections([...DATA_COLLECTIONS, SETTINGS_COLLECTION]);
      if (this.environment.demoDatasetUrl) {
        await this.writeLocalDataset(await this.readDemoDataset());
        await this.storage.put(SETTINGS_COLLECTION, { id: TEST_DATASET_INITIALIZED_ID, source: 'test-dataset', updatedAt: new Date().toISOString() });
        return;
      }
      await this.storage.put(SETTINGS_COLLECTION, { id: SETTINGS_ID, source: 'none', updatedAt: new Date().toISOString() } satisfies PersistenceSettings);
      await Promise.all([this.paymentMethodService.list(), this.serviceService.list()]);
    });
    this.source.set('none');
    this.syncStatus.setStatus('local-only');
    this.status.set('Database locale ripristinato alle impostazioni di fabbrica.');
  }

  private async initializeTestDataset(): Promise<void> {
    if (!this.environment.demoDatasetUrl) return;
    const initialized = await this.storage.get<{ id: string }>(SETTINGS_COLLECTION, TEST_DATASET_INITIALIZED_ID);
    if (initialized) return;
    await this.syncStatus.suppress(async () => {
      await this.storage.clearCollections([...DATA_COLLECTIONS, SETTINGS_COLLECTION]);
      await this.writeLocalDataset(await this.readDemoDataset());
      await this.storage.put(SETTINGS_COLLECTION, { id: TEST_DATASET_INITIALIZED_ID, source: 'test-dataset', updatedAt: new Date().toISOString() });
    });
  }

  private async readDemoDataset(): Promise<PersistedDataset> {
    const response = await fetch(new URL(this.environment.demoDatasetUrl!, document.baseURI));
    if (!response.ok) throw new Error('Impossibile caricare il dataset demo.');
    return this.parseDataset(await response.text());
  }

  async synchronize(): Promise<void> {
    this.ensureCapabilityAllowed('allowCloudSync');
    this.syncStatus.setStatus('syncing');
    try {
      await this.synchronizeInternal();
      this.syncStatus.setStatus(this.source() === 'none' ? 'local-only' : 'synced');
    } catch (error) {
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
    const merged = remote ? this.merge(local, remote) : local;
    await this.syncStatus.suppress(() => this.writeLocalDataset(merged));
    if (this.source() === 'file-system') await this.writeDirectoryDataset(merged);
    if (this.source() === 'google-drive') await this.writeDriveDataset(merged);
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
    await this.writeLocalDataset(this.merge(await this.readLocalDataset(), dataset));
    this.status.set('Dati importati nel database locale.');
  }

  async persistImportedFile(file: File): Promise<void> {
    this.ensureCapabilityAllowed('allowImportExport');
    const dataset = this.parseDataset(await file.text());
    await this.writeLocalDataset(this.merge(await this.readLocalDataset(), dataset));
    if (this.source() === 'file-system' && this.directoryHandle) await this.writeDirectoryDataset(await this.readLocalDataset());
    this.status.set('Dati importati e allineati.');
  }

  private async authorizeDrive(interactive = false): Promise<void> {
    await this.loadGoogleIdentityServices();
    const google = (window as Window & { google?: GoogleApi }).google;
    await new Promise<void>((resolve, reject) => {
      const client = google!.accounts.oauth2.initTokenClient({ client_id: this.driveClientId, scope: DRIVE_SCOPE, callback: (response) => response.error || !response.access_token ? reject(new Error('Autenticazione Google non riuscita.')) : (this.driveAccessToken = response.access_token, this.driveAccessTokenExpiresAt = Date.now() + (response.expires_in ?? 3600) * 1000, resolve()) });
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
    const response = await this.driveFetch(`https://www.googleapis.com/drive/v3/files?${new URLSearchParams({ q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, fields: 'files(id,name)', orderBy: 'name', pageSize: '1000', includeItemsFromAllDrives: 'true', supportsAllDrives: 'true', corpora: 'user' })}`);
    const data = await response.json() as { files?: DriveFolder[] };
    return data.files ?? [];
  }

  private async readDriveDataset(): Promise<PersistedDataset | null> {
    const folderId = this.getDriveFolderId();
    const response = await this.driveFetch(`https://www.googleapis.com/drive/v3/files?${new URLSearchParams({ q: `'${folderId}' in parents and name = '${DATA_FILE_NAME}' and trashed = false`, fields: 'files(id,modifiedTime)', orderBy: 'modifiedTime desc', pageSize: '1' })}`);
    const data = await response.json() as { files?: Array<{ id: string }> };
    if (!data.files?.length) return null;
    return this.parseDataset(await (await this.driveFetch(`https://www.googleapis.com/drive/v3/files/${data.files[0].id}?alt=media`)).text());
  }

  private async writeDriveDataset(dataset: PersistedDataset): Promise<void> {
    const folderId = this.getDriveFolderId();
    const search = await this.driveFetch(`https://www.googleapis.com/drive/v3/files?${new URLSearchParams({ q: `'${folderId}' in parents and name = '${DATA_FILE_NAME}' and trashed = false`, fields: 'files(id)', pageSize: '1' })}`);
    const files = await search.json() as { files?: Array<{ id: string }> };
    const metadata = JSON.stringify(files.files?.[0]
      ? { name: DATA_FILE_NAME, mimeType: DRIVE_FILE_MIME }
      : { name: DATA_FILE_NAME, mimeType: DRIVE_FILE_MIME, parents: [folderId] });
    const body = JSON.stringify(dataset);
    const url = files.files?.[0] ? `https://www.googleapis.com/upload/drive/v3/files/${files.files[0].id}?uploadType=multipart` : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const boundary = `abm-${Date.now()}`;
    const payload = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${DRIVE_FILE_MIME}\r\n\r\n${body}\r\n--${boundary}--`;
    await this.driveFetch(url, { method: files.files?.[0] ? 'PATCH' : 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: payload });
  }

  private async driveFetch(input: string, init: RequestInit = {}): Promise<Response> {
    if (!this.driveAccessToken || Date.now() >= this.driveAccessTokenExpiresAt - 60_000) await this.authorizeDrive(false);
    const response = await fetch(input, { ...init, headers: { Authorization: `Bearer ${this.driveAccessToken}`, ...(init.headers ?? {}) } });
    if (!response.ok) {
      let detail = '';
      try {
        const error = await response.json() as { error?: { message?: string; errors?: Array<{ reason?: string }> } };
        detail = error.error?.message ?? error.error?.errors?.[0]?.reason ?? '';
      } catch { detail = ''; }
      throw new Error(`Google Drive ha restituito ${response.status}${detail ? `: ${detail}` : '.'}`);
    }
    return response;
  }

  private async loadGoogleIdentityServices(): Promise<void> {
    if ((window as Window & { google?: GoogleApi }).google) return;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.onload = () => resolve(); script.onerror = () => reject(new Error('Impossibile caricare l\'autenticazione Google.')); document.head.appendChild(script);
    });
  }

  private getDriveFolderId(): string | undefined { return this.driveFolderId; }

  private async readLocalDataset(): Promise<PersistedDataset> {
    const collections: Record<string, readonly Record<string, unknown>[]> = {};
    for (const collection of DATA_COLLECTIONS) collections[collection] = await this.storage.list<Record<string, unknown>>(collection);
    return { format: 'artist-business-manager', version: 1, exportedAt: new Date().toISOString(), collections };
  }

  private async writeLocalDataset(dataset: PersistedDataset): Promise<void> {
    for (const collection of DATA_COLLECTIONS) for (const record of dataset.collections[collection] ?? []) await this.storage.put(collection, record);
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
    return parsed as PersistedDataset;
  }

  private driveFolderId: string | undefined;

  private async saveSettings(source: PersistenceSettings['source'], directoryHandle?: FileSystemDirectoryHandle, driveFolderId?: string, driveClientId?: string): Promise<void> {
    this.driveFolderId = driveFolderId ?? (source === 'google-drive' ? this.driveFolderId : undefined);
    await this.storage.put(SETTINGS_COLLECTION, { id: SETTINGS_ID, source, directoryHandle, driveFolderId: this.driveFolderId, driveClientId: driveClientId ?? this.driveClientId, updatedAt: new Date().toISOString() });
    this.source.set(source);
  }
}
