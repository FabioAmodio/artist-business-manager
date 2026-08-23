import { TestBed } from '@angular/core/testing';
import { FairRepository } from '../../core/repositories/fair.repository';
import type { Fair } from '../../domain/models/fair';
import { FairService } from './fair.service';

function createRepositoryMock() {
  const fairs = new Map<string, Fair>();
  return {
    fairs,
    getById: async (id: string) => fairs.get(id) ?? null,
    list: async () => [...fairs.values()],
    save: async (fair: Fair) => { fairs.set(fair.id, fair); },
    softDelete: async (id: string) => {
      const fair = fairs.get(id);
      if (fair) fairs.set(id, { ...fair, deletedAt: new Date().toISOString() });
    },
  };
}

describe('FairService', () => {
  it('creates and updates a fair without changing its identity', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({
      providers: [FairService, { provide: FairRepository, useValue: repository }],
    });
    const service = TestBed.inject(FairService);
    const created = await service.create({
      name: 'Lucca Comics', location: 'Lucca', startDate: '2026-10-28', endDate: '2026-11-01', notes: 'Stand A12',
    });
    const updated = await service.update(created.id, { ...created, name: 'Lucca Comics & Games' });

    expect(updated.id).toBe(created.id);
    expect(updated.name).toBe('Lucca Comics & Games');
    expect(repository.fairs.size).toBe(1);
  });

  it('rejects an invalid date range and delegates logical deletion', async () => {
    const repository = createRepositoryMock();
    TestBed.configureTestingModule({
      providers: [FairService, { provide: FairRepository, useValue: repository }],
    });
    const service = TestBed.inject(FairService);

    await expect(service.create({ name: 'Invalid', location: 'Test', startDate: '2026-10-02', endDate: '2026-10-01', notes: '' })).rejects.toThrow();
    const fair = await service.create({ name: 'Valid', location: 'Test', startDate: '2026-10-01', endDate: '2026-10-02', notes: '' });
    await service.delete(fair.id);

    expect(repository.fairs.get(fair.id)?.deletedAt).toBeDefined();
  });
});
