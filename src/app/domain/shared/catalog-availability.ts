import type { Bundle } from '../models/bundle';
import type { Product } from '../models/product';
import type { Service } from '../models/service';

export function isBundleAvailable(bundle: Bundle, products: readonly Product[], services: readonly Service[]): boolean {
  return bundle.active && bundle.items.length > 0 && bundle.items.every((item) => item.catalogKind === 'product'
    ? products.some((product) => product.id === item.catalogId && product.active)
    : services.some((service) => service.id === item.catalogId && service.active));
}