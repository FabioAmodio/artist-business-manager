import { TestBed } from '@angular/core/testing';
import { PurchaseRepository } from '../../core/repositories/purchase.repository';
import type { Purchase } from '../../domain/models/purchase';
import { PurchaseService } from './purchase.service';

function createRepositoryMock() {
  const purchases = new Map<string, Purchase>();
  return {
    purchases,
    getById: async (id: string) => purchases.get(id) ?? null,
    list: async () => [...purchases.values()],
    save: async (purchase: Purchase) => { purchases.set(purchase.id, purchase); },
    softDelete: async (id: string) => {
      const purchase = purchases.get(id);
      if (purchase) purchases.set(id, { ...purchase, deletedAt: new Date().toISOString() });
    },
  };
}

describe('PurchaseService', () => {
  it('creates and updates a purchase without creating stock movements', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({ providers: [PurchaseService, { provide: PurchaseRepository, useValue: repository }] });
    const service = TestBed.inject(PurchaseService);

    const created = await service.create({ supplierId: 'supplier-1', purchaseDate: '2026-08-25', description: '50 stampe A5', totalAmount: 120, notes: '', productId: undefined, lotId: undefined });
    const updated = await service.update(created.id, { ...created, description: '50 stampe A5 firmate', totalAmount: 135 });

    expect(updated.id).toBe(created.id);
    expect(updated.description).toBe('50 stampe A5 firmate');
    expect(updated.totalAmount).toBe(135);
    expect(updated.productId).toBeUndefined();
    expect(updated.lotId).toBeUndefined();
    expect(repository.purchases.size).toBe(1);
  });

  it('rejects missing required fields and delegates logical deletion', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({ providers: [PurchaseService, { provide: PurchaseRepository, useValue: repository }] });
    const service = TestBed.inject(PurchaseService);

    await expect(service.create({ purchaseDate: '', description: ' ', totalAmount: -1, notes: '', supplierId: undefined, productId: undefined, lotId: undefined })).rejects.toThrow();
    const created = await service.create({ supplierId: undefined, purchaseDate: '2026-08-25', description: '100 fumetti', totalAmount: 500, notes: '', productId: undefined, lotId: undefined });
    await service.delete(created.id);

    expect(repository.purchases.get(created.id)?.deletedAt).toBeDefined();
  });
});