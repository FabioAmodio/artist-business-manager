import { Provider } from '@angular/core';
import { APP_ENVIRONMENT, STORAGE_PROVIDER, SYNC_PROVIDER } from './environment.tokens';
import { environment } from '../../../environments/environment.demo';
import { IndexedDbProvider } from '../storage/indexed-db.provider';
import { DisabledSyncProvider } from '../synchronization/disabled-sync.provider';

export const environmentProviders: Provider[] = [
  { provide: APP_ENVIRONMENT, useValue: environment },
  { provide: STORAGE_PROVIDER, useClass: IndexedDbProvider },
  { provide: SYNC_PROVIDER, useClass: DisabledSyncProvider },
];