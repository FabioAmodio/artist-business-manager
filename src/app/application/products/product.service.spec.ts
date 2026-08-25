import { TestBed } from '@angular/core/testing';
import { ProductRepository } from '../../core/repositories/product.repository';
import type { Product } from '../../domain/models/product';
import { ProductService } from './product.service';

function createRepositoryMock() {
  const products = new Map<string, Product>();
  return {
    products,
    getById: async (id: string) => products.get(id) ?? null,
    list: async () => [...products.values()],
    save: async (product: Product) => { products.set(product.id, product); },
    softDelete: async (id: string) => {
      const product = products.get(id);
      if (product) products.set(id, { ...product, deletedAt: new Date().toISOString() });
    },
  };
}

describe('ProductService', () => {
  it('creates catalog products for commissions, sketches and bundles by name', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({ providers: [ProductService, { provide: ProductRepository, useValue: repository }] });
    const service = TestBed.inject(ProductService);

    const sketch = await service.create({ name: 'Sketch A5', description: '', suggestedPrice: 35, active: true, tags: [' fiera ', 'fiera'] });
    const bundle = await service.create({ name: 'Fumetto + Sketch', description: '', suggestedPrice: 50, active: true, tags: [] });

    expect(sketch.name).toBe('Sketch A5');
    expect(sketch.tags).toEqual(['fiera']);
    expect(bundle.name).toBe('Fumetto + Sketch');
    expect(repository.products.size).toBe(2);
  });

  it('updates product state and delegates logical deletion', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({ providers: [ProductService, { provide: ProductRepository, useValue: repository }] });
    const service = TestBed.inject(ProductService);

    await expect(service.create({ name: ' ', description: '', suggestedPrice: -1, active: true, tags: [] })).rejects.toThrow();
    const created = await service.create({ name: 'Fumetto', description: '', suggestedPrice: 12, active: true, tags: [] });
    const updated = await service.update(created.id, { ...created, active: false });
    await service.delete(created.id);

    expect(updated.active).toBe(false);
    expect(repository.products.get(created.id)?.deletedAt).toBeDefined();
  });
});