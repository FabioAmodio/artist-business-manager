import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { APP_ENVIRONMENT, STORAGE_PROVIDER } from '../../core/configuration/environment.tokens';
import type { AppEnvironment } from '../../core/configuration/app-environment';
import { SyncStatusService } from '../../core/synchronization/sync-status.service';
import { PaymentMethodService } from '../payment-methods/payment-method.service';
import { ServiceService } from '../services/service.service';
import { PersistenceService } from './persistence.service';

function setup(demoDatasetUrl?: string) {
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
        applicationName: 'Artist Business Manager', environmentName: 'test', storagePrefix: 'ABM-TEST', logLevel: 'debug', syncEnabled: false, allowExternalPersistence: false, allowImportExport: false, allowCloudSync: false, version: '0.0.0', demoDatasetUrl,
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

  it('loads the read-only demo dataset on first TEST initialization and restores it on reset', async () => {
    const dataset = { format: 'artist-business-manager', version: 1, collections: { products: [{ id: 'demo-product' }] } };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify(dataset) });
    vi.stubGlobal('fetch', fetchMock);
    const { service, storage, paymentMethodService, serviceService } = setup('assets/demo.json');

    await service.initialize();
    await service.factoryReset();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(storage.clearCollections).toHaveBeenCalledTimes(2);
    expect(storage.put).toHaveBeenCalledWith('products', { id: 'demo-product' });
    expect(storage.put).toHaveBeenCalledWith('appSettings', expect.objectContaining({ id: 'test-dataset-initialized' }));
    expect(paymentMethodService.list).not.toHaveBeenCalled();
    expect(serviceService.list).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('rejects external persistence operations in TEST', async () => {
    const { service } = setup();

    await expect(service.synchronize()).rejects.toThrow('non e disponibile nell\'ambiente TEST');
    await expect(service.exportLocal()).rejects.toThrow('non e disponibile nell\'ambiente TEST');
    await expect(service.importFile(new File(['{}'], 'data.json'))).rejects.toThrow('non e disponibile nell\'ambiente TEST');
  });
});
