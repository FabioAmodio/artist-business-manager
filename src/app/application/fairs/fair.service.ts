import { Injectable, inject } from '@angular/core';
import { FairRepository } from '../../core/repositories/fair.repository';
import type { Fair } from '../../domain/models/fair';

export type FairInput = Pick<Fair, 'name' | 'location' | 'startDate' | 'endDate' | 'notes'>;

@Injectable({ providedIn: 'root' })
export class FairService {
  private readonly repository = inject(FairRepository);

  list(): Promise<readonly Fair[]> {
    return this.repository.list();
  }

  async create(input: FairInput): Promise<Fair> {
    this.validate(input);
    const now = new Date().toISOString();
    const fair: Fair = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.save(fair);
    return fair;
  }

  async update(id: string, input: FairInput): Promise<Fair> {
    this.validate(input);
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Fiera non trovata.');
    const fair: Fair = { ...existing, ...input, updatedAt: new Date().toISOString() };
    await this.repository.save(fair);
    return fair;
  }

  delete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  private validate(input: FairInput): void {
    if (!input.name.trim()) throw new Error('Il nome della fiera e obbligatorio.');
    if (!input.location.trim()) throw new Error('Il luogo della fiera e obbligatorio.');
    if (!input.startDate || !input.endDate) throw new Error('Le date della fiera sono obbligatorie.');
    if (input.endDate < input.startDate) throw new Error('La data fine non puo precedere la data inizio.');
  }
}
