import { TestBed } from '@angular/core/testing';
import { OperationRepository } from '../../core/repositories/operation.repository';
import type { Operation } from '../../domain/models/operation';
import { OperationService } from './operation.service';

function createRepositoryMock() {
  const operations = new Map<string, Operation>();
  return {
    operations,
    getById: async (id: string) => operations.get(id) ?? null,
    list: async () => [...operations.values()].filter((operation) => !operation.deletedAt),
    save: async (operation: Operation) => { operations.set(operation.id, operation); },
    softDelete: async (id: string) => {
      const operation = operations.get(id);
      if (operation) operations.set(id, { ...operation, deletedAt: new Date().toISOString() });
    },
  };
}

describe('OperationService', () => {
  it('creates and updates an operation without changing identity', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({ providers: [OperationService, { provide: OperationRepository, useValue: repository }] });
    const service = TestBed.inject(OperationService);

    const created = await service.create({ type: 'work', title: 'Ritratto', description: '', productId: 'product-1', customerName: 'Cliente fiera', workStatus: 'requested', needsReview: false });
    const updated = await service.update(created.id, { ...created, title: 'Ritratto A4' });

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe('Ritratto A4');
    expect(updated.productId).toBe('product-1');
    expect(updated.customerName).toBe('Cliente fiera');
    expect(repository.operations.size).toBe(1);
  });

  it('rejects empty titles and delegates logical deletion', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({ providers: [OperationService, { provide: OperationRepository, useValue: repository }] });
    const service = TestBed.inject(OperationService);

    await expect(service.create({ type: 'sale', title: ' ', needsReview: false })).rejects.toThrow();
    const created = await service.create({ type: 'sale', title: 'Artbook', needsReview: false });
    await service.delete(created.id);

    expect(repository.operations.get(created.id)?.deletedAt).toBeDefined();
  });
});
