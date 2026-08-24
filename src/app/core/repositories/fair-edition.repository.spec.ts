import { TestBed } from '@angular/core/testing';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { FairEdition } from '../../domain/models/fair';
import { FairEditionRepository } from './fair-edition.repository';

const editions: readonly FairEdition[] = [
  {
    id: 'late', fairSeriesId: 'series', edition: 'Autunno 2026', name: 'Fiera tarda', location: 'B', startDate: '2026-10-10', endDate: '2026-10-11', createdAt: '', updatedAt: '',
  },
  {
    id: 'early', fairSeriesId: 'series', edition: 'Primavera 2026', name: 'Fiera presto', location: 'A', startDate: '2026-04-10', endDate: '2026-04-11', createdAt: '', updatedAt: '',
  },
];

describe('FairEditionRepository', () => {
  it('lists fair editions by ascending start date', async () => {
    TestBed.configureTestingModule({
      providers: [
        FairEditionRepository,
        { provide: STORAGE_PROVIDER, useValue: { list: async () => editions } },
      ],
    });

    const result = await TestBed.inject(FairEditionRepository).list();

    expect(result.map((fair) => fair.id)).toEqual(['early', 'late']);
  });
});
