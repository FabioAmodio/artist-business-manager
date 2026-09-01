import type { Bundle } from '../models/bundle';
import type { Product } from '../models/product';
import type { Service } from '../models/service';
import { isBundleAvailable } from './catalog-availability';

const now = '2026-09-01T00:00:00.000Z';
const product = { id: 'product', name: 'Prodotto', active: true, tags: [], createdAt: now, updatedAt: now } satisfies Product;
const service = { id: 'service', code: 'SERVICE', description: 'Servizio', active: true, system: false, createdAt: now, updatedAt: now } satisfies Service;
const bundle = {
  id: 'bundle', name: 'Pacchetto', active: true, items: [
    { id: 'product-item', catalogKind: 'product', catalogId: product.id, quantity: 1 },
    { id: 'service-item', catalogKind: 'service', catalogId: service.id, quantity: 1 },
  ], createdAt: now, updatedAt: now,
} satisfies Bundle;

describe('catalog availability', () => {
  it('makes a bundle unavailable when one of its services is unavailable', () => {
    expect(isBundleAvailable(bundle, [product], [{ ...service, active: false }])).toBe(false);
  });

  it('makes a bundle available when it and all its components are available', () => {
    expect(isBundleAvailable(bundle, [product], [service])).toBe(true);
  });
});