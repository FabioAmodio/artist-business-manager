import type { AppEnvironment } from '../app/core/configuration/app-environment';

export const environment: AppEnvironment = {
  applicationName: 'Artist Business Manager',
  environmentName: 'release',
  storagePrefix: 'ABM-PROD',
  logLevel: 'warn',
  syncEnabled: false,
  allowExternalPersistence: true,
  allowImportExport: true,
  allowCloudSync: true,
  version: '0.0.0',
  googleDriveClientId: '194726361871-r9bacqitdheihqql0ndgat7qo1it66gu.apps.googleusercontent.com',
};
