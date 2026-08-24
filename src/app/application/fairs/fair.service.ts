import { Injectable, inject } from '@angular/core';
import { FairEditionRepository } from '../../core/repositories/fair-edition.repository';
import { FairSeriesRepository } from '../../core/repositories/fair-series.repository';
import type { Fair, FairSeries } from '../../domain/models/fair';
import { validateFairInput, type FairValidationIssue } from '../../domain/rules/fair-validation';

export type FairInput = Pick<Fair, 'name' | 'location' | 'locationNotes' | 'startDate' | 'endDate' | 'notes' | 'edition' | 'expectedBudget' | 'standCost' | 'reimbursement' | 'hotelCost' | 'travelCost' | 'otherCosts' | 'standPaid' | 'travelPaid' | 'hotelPaid'> & {
  readonly fairSeriesId?: string;
};

export class FairValidationError extends Error {
  constructor(readonly issues: readonly FairValidationIssue[]) {
    super('La fiera contiene dati da verificare.');
    this.name = 'FairValidationError';
  }
}

@Injectable({ providedIn: 'root' })
export class FairService {
  private readonly repository = inject(FairEditionRepository);
  private readonly seriesRepository = inject(FairSeriesRepository);

  list(): Promise<readonly Fair[]> {
    return this.repository.list();
  }

  listSeries(): Promise<readonly FairSeries[]> {
    return this.seriesRepository.list();
  }

  async validate(input: FairInput, editingId?: string): Promise<readonly FairValidationIssue[]> {
    return validateFairInput(input, await this.repository.list(), editingId);
  }

  async create(input: FairInput, acknowledgeWarnings = false): Promise<Fair> {
    await this.assertValid(input, undefined, acknowledgeWarnings);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const seriesId = input.fairSeriesId ?? id;
    const series: FairSeries = {
      id: seriesId,
      name: input.name,
      defaultLocation: input.location,
      createdAt: now,
      updatedAt: now,
    };
    const fair: Fair = {
      ...input,
      id,
      fairSeriesId: seriesId,
      edition: input.edition,
      year: this.legacyYear(input.edition),
      createdAt: now,
      updatedAt: now,
    };
    if (!input.fairSeriesId) await this.seriesRepository.save(series);
    await this.repository.save(fair);
    return fair;
  }

  async update(id: string, input: FairInput, acknowledgeWarnings = false): Promise<Fair> {
    await this.assertValid(input, id, acknowledgeWarnings);
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Fiera non trovata.');
    const fair: Fair = { ...existing, ...input, fairSeriesId: existing.fairSeriesId, year: this.legacyYear(input.edition), updatedAt: new Date().toISOString() };
    await this.repository.save(fair);
    return fair;
  }

  delete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  private async assertValid(input: FairInput, editingId: string | undefined, acknowledgeWarnings: boolean): Promise<void> {
    const issues = await this.validate(input, editingId);
    const errors = issues.filter((issue) => issue.severity === 'ERROR');
    if (errors.length) throw new FairValidationError(errors);
    const warnings = issues.filter((issue) => issue.severity === 'WARNING');
    if (warnings.length && !acknowledgeWarnings) throw new FairValidationError(warnings);
  }

  private legacyYear(edition: string): number | undefined {
    const year = edition.match(/\b(19|20|21)\d{2}\b/);
    return year ? Number(year[0]) : undefined;
  }
}
