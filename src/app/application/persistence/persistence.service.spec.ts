import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { APP_ENVIRONMENT, STORAGE_PROVIDER } from '../../core/configuration/environment.tokens';
import type { AppEnvironment } from '../../core/configuration/app-environment';
import { SyncStatusService } from '../../core/synchronization/sync-status.service';
import { PaymentMethodService } from '../payment-methods/payment-method.service';
import { ServiceService } from '../services/service.service';
import { PersistenceService } from './persistence.service';

function setup() {
  const storage = {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    clearCollections: vi.fn().mockResolvedValue(undefined),
  };
  const paymentMethodService = { list: vi.fn().mockResolvedValue([]) };
  const serviceService = { list: vi.fn().mockResolvedValue([]) };
  TestBed.configureTestingModule({
    providers: [
      PersistenceService,
      SyncStatusService,
      { provide: APP_ENVIRONMENT, useValue: {
        applicationName: 'Artist Business Manager', environmentName: 'test', storagePrefix: 'ABM-TEST', logLevel: 'debug', syncEnabled: false, version: '0.0.0',
      } satisfies AppEnvironment },
      { provide: STORAGE_PROVIDER, useValue: storage },
      { provide: PaymentMethodService, useValue: paymentMethodService },
      { provide: ServiceService, useValue: serviceService },
    ],
  });
  return { service: TestBed.inject(PersistenceService), storage, paymentMethodService, serviceService };
}

describe('PersistenceService factory reset', () => {
  it('rejects reset when an external persistence source is active', async () => {
    const { service, storage } = setup();
    service.source.set('file-system');

    await expect(service.factoryReset()).rejects.toThrow('solo con sorgente dati Nessuna');
    expect(storage.clearCollections).not.toHaveBeenCalled();
  });

  it('clears local data and recreates mandatory system records', async () => {
    const { service, storage, paymentMethodService, serviceService } = setup();

    await service.factoryReset();

    expect(storage.clearCollections).toHaveBeenCalledOnce();
    expect(storage.clearCollections.mock.calls[0][0]).toContain('appSettings');
    expect(storage.put).toHaveBeenCalledWith('appSettings', expect.objectContaining({ id: 'current', source: 'none' }));
    expect(paymentMethodService.list).toHaveBeenCalledOnce();
    expect(serviceService.list).toHaveBeenCalledOnce();
  });
});
