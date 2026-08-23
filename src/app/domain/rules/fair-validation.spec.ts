import { validateFairInput } from './fair-validation';
import type { FairEdition } from '../models/fair';

const existingEdition: FairEdition = {
  id: 'existing-edition',
  fairSeriesId: 'alecomics',
  edition: '2026',
  year: 2026,
  name: 'Alecomics',
  location: 'Alessandria',
  startDate: '2026-05-15',
  endDate: '2026-05-17',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('validateFairInput', () => {
  it('returns a blocking error for an inverted date range', () => {
    const issues = validateFairInput({
      name: 'Nuova fiera', location: 'Torino', edition: '2027', startDate: '2027-06-20', endDate: '2027-06-19',
    }, []);

    expect(issues).toContainEqual(expect.objectContaining({ code: 'INVALID_DATE_RANGE', severity: 'ERROR' }));
  });

  it('warns about a duplicate edition without treating it as an error', () => {
    const issues = validateFairInput({
      name: 'Alecomics', location: 'Alessandria', fairSeriesId: 'alecomics', edition: '2026', startDate: '2026-05-15', endDate: '2026-05-17',
    }, [existingEdition]);

    expect(issues).toContainEqual(expect.objectContaining({ code: 'DUPLICATE_EDITION', severity: 'WARNING' }));
    expect(issues.some((issue) => issue.severity === 'ERROR')).toBe(false);
  });

  it('reports overlapping dates and an edition/date mismatch as warnings', () => {
    const issues = validateFairInput({
      name: 'Evento diverso', location: 'Torino', edition: '2027', startDate: '2026-05-16', endDate: '2026-05-18',
    }, [existingEdition]);

    expect(issues).toContainEqual(expect.objectContaining({ code: 'DATE_OVERLAP', severity: 'WARNING' }));
    expect(issues).toContainEqual(expect.objectContaining({ code: 'EDITION_DATE_MISMATCH', severity: 'WARNING' }));
  });

  it('does not check edition consistency when no year is identifiable', () => {
    const issues = validateFairInput({
      name: 'Evento stagionale', location: 'Torino', edition: 'Primavera', startDate: '2027-05-16', endDate: '2027-05-18',
    }, []);

    expect(issues.some((issue) => issue.code === 'EDITION_DATE_MISMATCH')).toBe(false);
  });
});
