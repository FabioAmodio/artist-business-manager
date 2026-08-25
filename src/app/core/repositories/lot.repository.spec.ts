import { TestBed } from '@angular/core/testing';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Lot } from '../../domain/models/lot';
import { LotRepository } from './lot.repository';

const lots: readonly Lot[] = [
  { id: 'march', name: 'Tipografia marzo 2026', productId: 'a5', purchaseId: 'purchase-1', lotDate: '2026-03-01', initialQuantity: 100, remainingQuantity: 80, totalCost: 180, unitCost: 1.8, createdAt: '', updatedAt: '' },
  { id: 'home', name: 'Stampe casalinghe', productId: 'a5', lotDate: '2026-01-01', initialQuantity: 20, remainingQuantity: 2, totalCost: 0, createdAt: '', updatedAt: '' },
  { id: 'deleted', name: 'Deleted', productId: 'comic', lotDate: '2026-01-01', createdAt: '', updatedAt: '', deletedAt: '2026-08-25T00:00:00.000Z' },
];

describe('LotRepository', () => {
  it('searches active lots and sorts them by name', async () => {
    TestBed.configureTestingModule({
      providers: [
        LotRepository,
        { provide: STORAGE_PROVIDER, useValue: { list: async () => lots } },
      ],
    });

    const result = await TestBed.inject(LotRepository).list({ text: 'stampe' });

    expect(result.map((lot) => lot.id)).toEqual(['home']);
  });

  it('filters lots by product and purchase', async () => {
    TestBed.configureTestingModule({
      providers: [
        LotRepository,
        { provide: STORAGE_PROVIDER, useValue: { list: async () => lots } },
      ],
    });

    const result = await TestBed.inject(LotRepository).list({ productId: 'a5', purchaseId: 'purchase-1' });

    expect(result.map((lot) => lot.id)).toEqual(['march']);
  });
});