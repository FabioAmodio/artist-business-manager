import { Injectable, inject } from '@angular/core';
import { LotRepository } from '../../core/repositories/lot.repository';
import type { Lot } from '../../domain/models/lot';

export type LotInput = Pick<Lot, 'name' | 'productId' | 'purchaseId' | 'lotDate' | 'initialQuantity' | 'remainingQuantity' | 'totalCost' | 'notes'>;

@Injectable({ providedIn: 'root' })
export class LotService {
  private readonly repository = inject(LotRepository);

  list(query = ''): Promise<readonly Lot[]> {
    return this.repository.list({ text: query || undefined });
  }

  async create(input: LotInput): Promise<Lot> {
    this.validate(input);
    const now = new Date().toISOString();
    const lot: Lot = {
      ...input,
      unitCost: this.calculateUnitCost(input),
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.save(lot);
    return lot;
  }

  async update(id: string, input: LotInput): Promise<Lot> {
    this.validate(input);
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Lotto non trovato.');
    const lot: Lot = { ...existing, ...input, unitCost: this.calculateUnitCost(input), updatedAt: new Date().toISOString() };
    await this.repository.save(lot);
    return lot;
  }

  delete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  private validate(input: LotInput): void {
    if (!input.name.trim()) throw new Error('Il nome lotto e obbligatorio.');
    if (!input.productId) throw new Error('Il prodotto associato e obbligatorio.');
    if (input.initialQuantity !== undefined && input.initialQuantity < 0) throw new Error('La quantita iniziale deve essere positiva o zero.');
    if (input.remainingQuantity !== undefined && input.remainingQuantity < 0) throw new Error('La quantita residua deve essere positiva o zero.');
    if (input.totalCost !== undefined && input.totalCost < 0) throw new Error('Il costo totale deve essere positivo o zero.');
    if (input.initialQuantity !== undefined && input.remainingQuantity !== undefined && input.remainingQuantity > input.initialQuantity) throw new Error('La quantita residua non puo superare la quantita iniziale.');
  }

  private calculateUnitCost(input: LotInput): number | undefined {
    if (!input.totalCost || !input.initialQuantity) return undefined;
    return input.totalCost / input.initialQuantity;
  }
}