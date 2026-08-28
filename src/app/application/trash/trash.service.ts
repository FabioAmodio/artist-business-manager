import { Injectable, inject, signal } from '@angular/core';
import { STORAGE_PROVIDER } from '../../core/configuration/environment.tokens';
import type { EntityId } from '../../domain/shared/types';
import type { IStorageProvider } from '../../core/storage/storage-provider';

export interface TrashEntry {
  readonly id: EntityId;
  readonly collection: string;
  readonly type: string;
  readonly label: string;
  readonly deletedAt?: string;
}

const COLLECTION_LABELS: Record<string, string> = {
  bundles: 'Pacchetto',
  fairs: 'Evento',
  fairSeries: 'Serie eventi',
  fairEditions: 'Edizione evento',
  lots: 'Acquisto collegato',
  operations: 'Operazione',
  paymentMethods: 'Modalita di pagamento',
  payments: 'Pagamento',
  parties: 'Anagrafica',
  products: 'Prodotto',
  purchases: 'Acquisto',
  services: 'Servizio',
};

const COLLECTIONS = Object.keys(COLLECTION_LABELS);

@Injectable({ providedIn: 'root' })
export class TrashService {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);
  readonly hasDeletedItems = signal(false);

  async list(): Promise<readonly TrashEntry[]> {
    const records = await Promise.all(COLLECTIONS.map(async (collection) => ({ collection, records: await this.storage.list<Record<string, unknown>>(collection) })));
    const entries = records.flatMap(({ collection, records }) => records
      .filter((record) => typeof record['deletedAt'] === 'string')
      .map((record) => ({ id: String(record['id']), collection, type: COLLECTION_LABELS[collection], label: this.labelFor(collection, record), deletedAt: String(record['deletedAt']) }))
    ).sort((first, second) => (second.deletedAt ?? '').localeCompare(first.deletedAt ?? '') || first.label.localeCompare(second.label));
    this.hasDeletedItems.set(entries.length > 0);
    return entries;
  }

  async restore(entry: TrashEntry): Promise<void> {
    const record = await this.storage.get<Record<string, unknown>>(entry.collection, entry.id);
    if (!record) throw new Error('Elemento non trovato nel cestino.');
    const { deletedAt: _deletedAt, ...restored } = record;
    await this.storage.put(entry.collection, restored);
  }

  deletePermanent(entry: TrashEntry): Promise<void> {
    return this.storage.deletePermanent(entry.collection, entry.id);
  }

  private labelFor(collection: string, record: Record<string, unknown>): string {
    if (collection === 'payments') return typeof record['amount'] === 'number' ? `${(record['amount'] as number).toFixed(2)} EUR` : 'Pagamento';
    return String(record['name'] ?? record['title'] ?? record['description'] ?? record['displayName'] ?? record['code'] ?? record['id']);
  }
}
