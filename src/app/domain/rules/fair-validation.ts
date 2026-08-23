import type { FairEdition } from '../models/fair';
import type { ValidationIssue } from './validation';

export type FairValidationCode = 'REQUIRED_FIELD' | 'INVALID_DATE_RANGE' | 'DUPLICATE_EDITION' | 'DATE_OVERLAP' | 'EDITION_DATE_MISMATCH' | 'INCOMPLETE_DATA';

export type FairValidationIssue = ValidationIssue<FairValidationCode> & {
  readonly relatedFairIds?: readonly string[];
};

export interface FairValidationInput {
  readonly fairSeriesId?: string;
  readonly edition: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly name: string;
  readonly location: string;
}

export function validateFairInput(input: FairValidationInput, existingEditions: readonly FairEdition[], editingId?: string): readonly FairValidationIssue[] {
  const issues: FairValidationIssue[] = [];

  const requiredFields: readonly [keyof FairValidationInput, string][] = [
    ['name', 'Il nome della fiera e obbligatorio.'],
    ['location', 'Il luogo della fiera e obbligatorio.'],
    ['edition', "L'edizione della fiera e obbligatoria."],
    ['startDate', 'La data di inizio della fiera e obbligatoria.'],
    ['endDate', 'La data di fine della fiera e obbligatoria.'],
  ];
  for (const [field, message] of requiredFields) {
    if (!input[field]?.trim()) {
      issues.push({ severity: 'ERROR', code: 'REQUIRED_FIELD', message, fields: [field] });
    }
  }

  if (input.endDate && input.startDate && input.endDate < input.startDate) {
    issues.push({
      severity: 'ERROR',
      code: 'INVALID_DATE_RANGE',
      message: 'La data di fine non puo essere precedente alla data di inizio.',
      fields: ['startDate', 'endDate'],
    });
  }

  const seriesEditions = input.fairSeriesId
    ? existingEditions.filter((edition) => edition.fairSeriesId === input.fairSeriesId && edition.id !== editingId)
    : [];
  const duplicate = seriesEditions.find((edition) => edition.edition.trim().toLowerCase() === input.edition.trim().toLowerCase());
  if (duplicate) {
    issues.push({
      severity: 'WARNING',
      code: 'DUPLICATE_EDITION',
      message: `Esiste gia un'edizione "${duplicate.edition}" di questa fiera. Verificare prima di salvare.`,
      relatedFairIds: [duplicate.id],
      fields: ['name', 'edition'],
    });
  }

  if (input.startDate && input.endDate) {
    const overlaps = existingEditions.filter((edition) => edition.id !== editingId
      && edition.startDate <= input.endDate
      && input.startDate <= edition.endDate);
    if (overlaps.length) {
      issues.push({
        severity: 'WARNING',
        code: 'DATE_OVERLAP',
        message: `Le date si sovrappongono a: ${overlaps.map((edition) => `${edition.name} (${edition.edition})`).join(', ')}.`,
        relatedFairIds: overlaps.map((edition) => edition.id),
        fields: ['startDate', 'endDate'],
      });
    }
  }

  const editionYear = input.edition.match(/\b(19|20|21)\d{2}\b/);
  const dateYear = input.startDate.match(/^\d{4}/);
  if (editionYear && dateYear && editionYear[0] !== dateYear[0]) {
    issues.push({
      severity: 'WARNING',
      code: 'EDITION_DATE_MISMATCH',
      message: `L'edizione sembra riferirsi al ${editionYear[0]} ma le date appartengono al ${dateYear[0]}. Verificare i dati inseriti.`,
      fields: ['edition', 'startDate'],
    });
  }

  if (!input.name.trim() || !input.location.trim() || !input.edition.trim()) {
    issues.push({
      severity: 'WARNING',
      code: 'INCOMPLETE_DATA',
      message: 'Alcuni dati della fiera sono incompleti.',
      fields: ['name', 'location', 'edition'],
    });
  }

  return issues;
}
