import type { EntityId } from '../shared/types';
import type { Product } from '../models/product';
import type { ProductFilter } from './repository-types';

export interface IProductRepository {
  getById(id: EntityId): Promise<Product | null>;
  list(filter?: ProductFilter): Promise<readonly Product[]>;
  save(product: Product): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}
