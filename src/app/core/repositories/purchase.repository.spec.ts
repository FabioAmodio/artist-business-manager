import { TestBed } from '@angular/core/testing';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Purchase } from '../../domain/models/purchase';
import { PurchaseRepository } from './purchase.repository';

const purchases: readonly Purchase[] = [
  { id: 'old', supplierId: 'supplier-1', purchaseDate: '2026-08-20', description: '100 fumetti', totalAmount: 500, createdAt: '', updatedAt: '2026-08-20T10:00:00.000Z' },
  { id: 'new', supplierId: 'supplier-2', purchaseDate: '2026-08-25', description: '50 stampe A5', totalAmount: 120, createdAt: '', updatedAt: '2026-08-25T10:00:00.000Z' },
  { id: 'deleted', supplierId: 'supplier-1', purchaseDate: '2026-08-26', description: 'Deleted', totalAmount: 1, createdAt: '', updatedAt: '', deletedAt: '2026-08-26T00:00:00.000Z' },
];

describe('PurchaseRepository', () => {
  it('filters active purchases by text and sorts newest first', async () => {
    TestBed.configureTestingModule({
      providers: [
        PurchaseRepository,
        { provide: STORAGE_PROVIDER, useValue: { list: async () => purchases } },
      ],
    });

    const result = await TestBed.inject(PurchaseRepository).list({ text: 'stampe' });

    expect(result.map((purchase) => purchase.id)).toEqual(['new']);
  });

  it('filters purchases by supplier', async () => {
    TestBed.configureTestingModule({
      providers: [
        PurchaseRepository,
        { provide: STORAGE_PROVIDER, useValue: { list: async () => purchases } },
      ],
    });

    const result = await TestBed.inject(PurchaseRepository).list({ supplierId: 'supplier-1' });

    expect(result.map((purchase) => purchase.id)).toEqual(['old']);
  });
});