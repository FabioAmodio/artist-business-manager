import { InjectionToken } from '@angular/core';
import type { AppEnvironment } from './app-environment';
import type { IStorageProvider } from '../storage/storage-provider';

export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');
export const STORAGE_PROVIDER = new InjectionToken<IStorageProvider>('STORAGE_PROVIDER');
export const SYNC_PROVIDER = new InjectionToken<unknown>('SYNC_PROVIDER');
