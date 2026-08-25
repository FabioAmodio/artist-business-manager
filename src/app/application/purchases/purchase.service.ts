import { Injectable, inject } from '@angular/core';
import { PurchaseRepository } from '../../core/repositories/purchase.repository';
import type { Purchase } from '../../domain/models/purchase';

export type PurchaseInput = Pick<Purchase, 'supplierId' | 'purchaseDate' | 'description' | 'totalAmount' | 'notes' | 'productId' | 'lotId'>;

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly repository = inject(PurchaseRepository);

  list(query = ''): Promise<readonly Purchase[]> {
    return this.repository.list({ text: query || undefined });
  }

  async create(input: PurchaseInput): Promise<Purchase> {
    this.validate(input);
    const now = new Date().toISOString();
    const purchase: Purchase = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.save(purchase);
    return purchase;
  }

  async update(id: string, input: PurchaseInput): Promise<Purchase> {
    this.validate(input);
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Acquisto non trovato.');
    const purchase: Purchase = { ...existing, ...input, updatedAt: new Date().toISOString() };
    await this.repository.save(purchase);
    return purchase;
  }

  delete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  private validate(input: PurchaseInput): void {
    if (!input.purchaseDate.trim()) throw new Error('La data acquisto e obbligatoria.');
    if (!input.description.trim()) throw new Error('La descrizione e obbligatoria.');
    if (!Number.isFinite(input.totalAmount) || input.totalAmount < 0) throw new Error('L\'importo totale deve essere positivo o zero.');
  }
}