import { Injectable, inject } from '@angular/core';
import { ProductRepository } from '../../core/repositories/product.repository';
import type { Product } from '../../domain/models/product';

export type ProductInput = Pick<Product, 'name' | 'description' | 'suggestedPrice' | 'active' | 'tags' | 'lotId'>;

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly repository = inject(ProductRepository);

  list(query = ''): Promise<readonly Product[]> {
    return this.repository.list({ text: query || undefined });
  }

  async create(input: ProductInput): Promise<Product> {
    this.validate(input);
    const now = new Date().toISOString();
    const product: Product = {
      ...input,
      tags: this.normalizeTags(input.tags),
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.save(product);
    return product;
  }

  async update(id: string, input: ProductInput): Promise<Product> {
    this.validate(input);
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Prodotto non trovato.');
    const product: Product = { ...existing, ...input, tags: this.normalizeTags(input.tags), updatedAt: new Date().toISOString() };
    await this.repository.save(product);
    return product;
  }

  delete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  private validate(input: ProductInput): void {
    if (!input.name.trim()) throw new Error('Il nome e obbligatorio.');
    if (input.suggestedPrice !== undefined && (!Number.isFinite(input.suggestedPrice) || input.suggestedPrice < 0)) throw new Error('Il prezzo suggerito deve essere positivo o zero.');
  }

  private normalizeTags(tags: readonly string[]): readonly string[] {
    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  }
}
