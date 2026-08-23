import { TestBed } from '@angular/core/testing';
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
});
