import { TestBed } from '@angular/core/testing';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Product } from '../../domain/models/product';
import { ProductRepository } from './product.repository';

const products: readonly Product[] = [
  { id: 'comic', name: 'Fumetto', description: '', suggestedPrice: 12, active: true, tags: ['fiera'], createdAt: '', updatedAt: '' },
  { id: 'sketch', name: 'Sketch A5', description: 'Rapido', suggestedPrice: 35, active: true, tags: ['commissione'], createdAt: '', updatedAt: '' },
  { id: 'inactive', name: 'Vecchia stampa A4', description: '', suggestedPrice: 10, active: false, tags: [], createdAt: '', updatedAt: '' },
  { id: 'deleted', name: 'Deleted', description: '', suggestedPrice: 1, active: true, tags: [], createdAt: '', updatedAt: '', deletedAt: '2026-08-25T00:00:00.000Z' },
];

describe('ProductRepository', () => {
  it('searches active catalog products by text and sorts them by name', async () => {
    TestBed.configureTestingModule({
      providers: [
        ProductRepository,
        { provide: STORAGE_PROVIDER, useValue: { list: async () => products } },
      ],
    });

    const result = await TestBed.inject(ProductRepository).list({ text: 'fiera', active: true });

    expect(result.map((product) => product.id)).toEqual(['comic']);
  });

  it('can list inactive products without category filtering', async () => {
    TestBed.configureTestingModule({
      providers: [
        ProductRepository,
        { provide: STORAGE_PROVIDER, useValue: { list: async () => products } },
      ],
    });

    const result = await TestBed.inject(ProductRepository).list({ active: false });

    expect(result.map((product) => product.id)).toEqual(['inactive']);
  });
});