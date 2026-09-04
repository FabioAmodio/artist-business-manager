import { Provider } from '@angular/core';
import { APP_ENVIRONMENT, STORAGE_PROVIDER, SYNC_PROVIDER } from './environment.tokens';
import { environment } from '../../../environments/environment.test';
import { DelegatingStorageProvider } from '../storage/delegating-storage.provider';
import { FirestoreProvider } from '../storage/firestore.provider';
import { IndexedDbProvider } from '../storage/indexed-db.provider';
import { DisabledSyncProvider } from '../synchronization/disabled-sync.provider';

export const environmentProviders: Provider[] = [
  { provide: APP_ENVIRONMENT, useValue: environment },
  IndexedDbProvider,
  FirestoreProvider,
  { provide: STORAGE_PROVIDER, useClass: DelegatingStorageProvider },
  { provide: SYNC_PROVIDER, useClass: DisabledSyncProvider },
];