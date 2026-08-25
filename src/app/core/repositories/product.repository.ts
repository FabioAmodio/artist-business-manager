import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { Product } from '../../domain/models/product';
import type { IProductRepository } from '../../domain/repositories/product.repository';
import type { ProductFilter } from '../../domain/repositories/repository-types';
import type { IStorageProvider } from '../storage/storage-provider';

const COLLECTION = 'products';

@Injectable({ providedIn: 'root' })
export class ProductRepository implements IProductRepository {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);

  async getById(id: string): Promise<Product | null> {
    const product = await this.storage.get<Product>(COLLECTION, id);
    return product?.deletedAt ? null : product;
  }

  async list(filter?: ProductFilter): Promise<readonly Product[]> {
    const normalized = filter?.text?.trim().toLowerCase() ?? '';
    const products = await this.storage.list<Product>(COLLECTION);
    return products
      .filter((product) => filter?.includeDeleted || !product.deletedAt)
      .filter((product) => filter?.active === undefined || product.active === filter.active)
      .filter((product) => !normalized || `${product.name} ${product.description ?? ''} ${product.tags.join(' ')}`.toLowerCase().includes(normalized))
      .sort((first, second) => first.name.localeCompare(second.name));
  }

  save(product: Product): Promise<void> {
    return this.storage.put(COLLECTION, product);
  }

  softDelete(id: string): Promise<void> {
    return this.storage.deleteLogical(COLLECTION, id);
  }
}