import { Injectable, inject } from '@angular/core';
import { LotRepository } from '../../core/repositories/lot.repository';
import type { Lot } from '../../domain/models/lot';

export type LotInput = Pick<Lot, 'name' | 'productId' | 'purchaseId' | 'aliases' | 'notes'>;

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
      aliases: this.normalizeAliases(input.aliases),
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
    if (!existing) throw new Error('Collegamento non trovato.');
    const lot: Lot = { ...existing, ...input, aliases: this.normalizeAliases(input.aliases), updatedAt: new Date().toISOString() };
    await this.repository.save(lot);
    return lot;
  }

  delete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  private validate(input: LotInput): void {
    if (!input.name.trim()) throw new Error('Il nome collegamento e obbligatorio.');
    if (!input.productId) throw new Error('Il prodotto associato e obbligatorio.');
  }

  private normalizeAliases(aliases: readonly string[]): readonly string[] {
    return [...new Set(aliases.map((alias) => alias.trim()).filter(Boolean))];
  }
}