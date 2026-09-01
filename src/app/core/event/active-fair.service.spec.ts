import { TestBed } from '@angular/core/testing';
import { FairService } from '../../application/fairs/fair.service';
import type { Fair } from '../../domain/models/fair';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import { ActiveFairService } from './active-fair.service';

const fair: Fair = { id: 'fair-1', fairSeriesId: 'series-1', edition: '2025', name: 'Fiera scelta', location: 'Roma', startDate: '2025-01-01', endDate: '2025-01-02', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' };

describe('ActiveFairService', () => {
  it('persists a forced fair and clears it', async () => {
    const settings = new Map<string, unknown>();
    TestBed.configureTestingModule({ providers: [
      ActiveFairService,
      { provide: FairService, useValue: { list: async () => [fair] } },
      { provide: STORAGE_PROVIDER, useValue: {
        get: async (_collection: string, id: string) => settings.get(id) ?? null,
        put: async (_collection: string, value: { id: string }) => { settings.set(value.id, value); },
        deletePermanent: async (_collection: string, id: string) => { settings.delete(id); },
      } },
    ] });
    const service = TestBed.inject(ActiveFairService);
    await service.initialize();

    await service.forceFair(fair.id);
    expect(service.activeFair()?.id).toBe(fair.id);
    expect(service.isForced()).toBe(true);

    await service.clearForcedFair();
    expect(service.activeFair()).toBeNull();
    expect(service.isForced()).toBe(false);
  });
});