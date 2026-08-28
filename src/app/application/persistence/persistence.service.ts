import { Injectable, inject, signal } from '@angular/core';
import { STORAGE_PROVIDER } from '../../core/configuration/environment.tokens';
import type { IStorageProvider } from '../../core/storage/storage-provider';
import type { PersistedDataset, PersistenceSettings } from '../../core/persistence/persistence.models';

const SETTINGS_COLLECTION = 'appSettings';
const SETTINGS_ID = 'current';
const DATA_FILE_NAME = 'artist-business-manager-data.json';
const DATA_COLLECTIONS = ['bundles', 'fairs', 'fairSeries', 'fairEditions', 'lots', 'operations', 'paymentMethods', 'payments', 'parties', 'products', 'purchases', 'services'];

@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);
  readonly source = signal<PersistenceSettings['source']>('none');
  readonly status = signal('');
  private directoryHandle: FileSystemDirectoryHandle | undefined;

  async initialize(): Promise<void> {
    const settings = await this.storage.get<PersistenceSettings>(SETTINGS_COLLECTION, SETTINGS_ID);
    this.source.set(settings?.source ?? 'none');
    this.directoryHandle = settings?.directoryHandle;
  }

  async chooseFileSystem(): Promise<void> {
    const picker = (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
    if (!picker) throw new Error('La selezione diretta della cartella non e supportata da questo browser. Usa importa/esporta file.');
    this.directoryHandle = await picker();
    await this.saveSettings('file-system', this.directoryHandle);
    await this.synchronize();
  }

  async disable(): Promise<void> {
    this.directoryHandle = undefined;
    await this.saveSettings('none');
    this.status.set('Nessuna sorgente persistente configurata.');
  }

  async synchronize(): Promise<void> {
    if (this.source() !== 'file-system') throw new Error('Configura prima una sorgente File System.');
    if (!this.directoryHandle) throw new Error('La cartella persistente non e disponibile. Selezionala nuovamente.');
    const local = await this.readLocalDataset();
    const remote = await this.readDirectoryDataset();
    const merged = remote ? this.merge(local, remote) : local;
    await this.writeLocalDataset(merged);
    await this.writeDirectoryDataset(merged);
    this.status.set(remote ? 'Dati locali e persistenti allineati.' : 'Dati locali copiati nella cartella persistente.');
  }

  async exportLocal(): Promise<void> {
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
    const dataset = this.parseDataset(await file.text());
    await this.writeLocalDataset(this.merge(await this.readLocalDataset(), dataset));
    this.status.set('Dati importati nel database locale.');
  }

  async persistImportedFile(file: File): Promise<void> {
    const dataset = this.parseDataset(await file.text());
    await this.writeLocalDataset(this.merge(await this.readLocalDataset(), dataset));
    if (this.source() === 'file-system' && this.directoryHandle) await this.writeDirectoryDataset(await this.readLocalDataset());
    this.status.set('Dati importati e allineati.');
  }

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

  private async saveSettings(source: PersistenceSettings['source'], directoryHandle?: FileSystemDirectoryHandle): Promise<void> {
    await this.storage.put(SETTINGS_COLLECTION, { id: SETTINGS_ID, source, directoryHandle, updatedAt: new Date().toISOString() });
    this.source.set(source);
  }
}
