import type { AppEnvironment } from '../app/core/configuration/app-environment';

export const environment: AppEnvironment = {
  applicationName: 'Artist Business Manager',
  environmentName: 'release',
  storagePrefix: 'ABM-PROD',
  logLevel: 'warn',
  syncEnabled: false,
  version: '0.0.0',
};
