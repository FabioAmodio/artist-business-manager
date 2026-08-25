import { TestBed } from '@angular/core/testing';
import { LotRepository } from '../../core/repositories/lot.repository';
import type { Lot } from '../../domain/models/lot';
import { LotService } from './lot.service';

function createRepositoryMock() {
  const lots = new Map<string, Lot>();
  return {
    lots,
    getById: async (id: string) => lots.get(id) ?? null,
    list: async () => [...lots.values()],
    save: async (lot: Lot) => { lots.set(lot.id, lot); },
    softDelete: async (id: string) => {
      const lot = lots.get(id);
      if (lot) lots.set(id, { ...lot, deletedAt: new Date().toISOString() });
    },
  };
}

describe('LotService', () => {
  it('creates a lot associated with a product and purchase', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({ providers: [LotService, { provide: LotRepository, useValue: repository }] });
    const service = TestBed.inject(LotService);

    const created = await service.create({ name: 'Tipografia marzo 2026', productId: 'product-a5', purchaseId: 'purchase-1', aliases: ['Ramba', 'Ramba'], notes: '' });

    expect(created.productId).toBe('product-a5');
    expect(created.purchaseId).toBe('purchase-1');
    expect(created.aliases).toEqual(['Ramba']);
  });

  it('rejects missing product and delegates logical deletion', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({ providers: [LotService, { provide: LotRepository, useValue: repository }] });
    const service = TestBed.inject(LotService);

    await expect(service.create({ name: 'Invalid', productId: '', purchaseId: undefined, aliases: [], notes: '' })).rejects.toThrow();
    const created = await service.create({ name: 'Stampe casalinghe', productId: 'product-a5', purchaseId: undefined, aliases: [], notes: '' });
    await service.delete(created.id);

    expect(repository.lots.get(created.id)?.deletedAt).toBeDefined();
  });
});