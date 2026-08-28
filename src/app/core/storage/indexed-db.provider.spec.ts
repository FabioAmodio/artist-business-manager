import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { APP_ENVIRONMENT } from '../configuration/environment.tokens';
import type { AppEnvironment } from '../configuration/app-environment';
import { IndexedDbProvider } from './indexed-db.provider';

describe('IndexedDbProvider', () => {
  it('builds the database name with the configured storage prefix', async () => {
    const testEnvironment: AppEnvironment = {
      applicationName: 'Artist Business Manager',
      environmentName: 'test',
      storagePrefix: 'ABM-TEST',
      logLevel: 'debug',
      syncEnabled: false,
      version: '0.0.0',
    };

    TestBed.configureTestingModule({
      providers: [
        IndexedDbProvider,
        { provide: APP_ENVIRONMENT, useValue: testEnvironment },
      ],
    });

    const health = await TestBed.inject(IndexedDbProvider).health();

    expect(health.databaseName).toBe('ABM-TEST-Artist Business Manager');
  });

  it('allows bundle records to be saved and listed', async () => {
    TestBed.configureTestingModule({
      providers: [
        IndexedDbProvider,
        { provide: APP_ENVIRONMENT, useValue: {
          applicationName: 'Artist Business Manager',
          environmentName: 'test',
          storagePrefix: 'ABM-TEST',
          logLevel: 'debug',
          syncEnabled: false,
          version: '0.0.0',
        } satisfies AppEnvironment },
      ],
    });
    const provider = TestBed.inject(IndexedDbProvider);
    const putSpy = vi.fn();
    const listSpy = vi.fn().mockResolvedValue([{ id: 'bundle-1', name: 'Pacchetto' }]);

    (provider as any).database = {
      table: () => ({ put: putSpy, toArray: listSpy }),
    };

    await provider.put('bundles', { id: 'bundle-1', name: 'Pacchetto' });
    const bundles = await provider.list('bundles');

    expect(putSpy).toHaveBeenCalledWith({ id: 'bundle-1', name: 'Pacchetto' });
    expect(bundles).toEqual([{ id: 'bundle-1', name: 'Pacchetto' }]);
  });
});
