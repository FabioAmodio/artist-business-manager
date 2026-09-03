import type { AppEnvironment } from '../app/core/configuration/app-environment';

export const environment: AppEnvironment = {
  applicationName: 'Artist Business Manager',
  environmentName: 'demo',
  storagePrefix: 'ABM-DEMO',
  logLevel: 'info',
  syncEnabled: false,
  allowExternalPersistence: false,
  allowImportExport: false,
  allowCloudSync: false,
  version: '0.0.0',
  demoDatasetUrl: 'assets/artist-business-manager-data-test.json',
};