import { TestBed } from '@angular/core/testing';
import type { Operation } from '../../domain/models/operation';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { IStorageProvider, StorageFilter, StorageHealth } from '../storage/storage-provider';
import { OperationRepository } from './operation.repository';

class FakeStorageProvider implements IStorageProvider {
  readonly items = new Map<string, Operation>();

  async open(): Promise<void> {}
  async close(): Promise<void> {}
  async get<T>(collection: string, id: string): Promise<T | null> { return (collection === 'operations' ? this.items.get(id) as T | undefined : undefined) ?? null; }
  async list<T>(_collection: string, _filter?: StorageFilter): Promise<readonly T[]> { return [...this.items.values()] as unknown as readonly T[]; }
  async put<T>(collection: string, value: T): Promise<void> { if (collection === 'operations') this.items.set((value as Operation).id, value as Operation); }
  async deleteLogical(collection: string, id: string): Promise<void> { const item = this.items.get(id); if (collection === 'operations' && item) this.items.set(id, { ...item, deletedAt: '2025-01-01T00:00:00.000Z' }); }
  async deletePermanent(_collection: string, id: string): Promise<void> { this.items.delete(id); }
  async transaction<T>(_collections: readonly string[], action: () => Promise<T>): Promise<T> { return action(); }
  async health(): Promise<StorageHealth> { return { available: true, provider: 'fake', databaseName: 'fake', schemaVersion: 1, migrationVersion: 1, checkedAt: '2025-01-01T00:00:00.000Z' }; }
}

function operation(input: Partial<Operation>): Operation {
  const now = '2025-01-01T00:00:00.000Z';
  return { id: crypto.randomUUID(), type: 'work', title: 'Operation', createdAt: now, updatedAt: now, ...input };
}

describe('OperationRepository', () => {
  it('filters active operations by type and text and sorts newest first', async () => {
    const storage = new FakeStorageProvider();
    TestBed.configureTestingModule({ providers: [OperationRepository, { provide: STORAGE_PROVIDER, useValue: storage }] });
    const repository = TestBed.inject(OperationRepository);
    await repository.save(operation({ title: 'Poster', type: 'sale', updatedAt: '2025-01-02T00:00:00.000Z' }));
    await repository.save(operation({ title: 'Ritratto digitale', type: 'work', updatedAt: '2025-01-03T00:00:00.000Z' }));
    await repository.save(operation({ title: 'Ritratto eliminato', type: 'work', updatedAt: '2025-01-04T00:00:00.000Z', deletedAt: '2025-01-05T00:00:00.000Z' }));

    const result = await repository.list({ type: 'work', text: 'ritratto' });

    expect(result.map((item) => item.title)).toEqual(['Ritratto digitale']);
  });
});
