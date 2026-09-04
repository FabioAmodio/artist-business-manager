import type { AppEnvironment } from '../app/core/configuration/app-environment';

export const environment: AppEnvironment = {
  applicationName: 'Artist Business Manager',
  environmentName: 'test',
  storagePrefix: 'ABM-TEST',
  logLevel: 'debug',
  syncEnabled: false,
  allowExternalPersistence: false,
  allowImportExport: true,
  allowCloudSync: false,
  version: '0.0.0',
  defaultPersistenceMode: 'offline',
  firebase: {
    apiKey: 'AIzaSyA4V6V1RAycpQUh_v4u9m2PFreGNODwKgQ',
    authDomain: 'artist-business-manager-test.firebaseapp.com',
    projectId: 'artist-business-manager-test',
    storageBucket: 'artist-business-manager-test.firebasestorage.app',
    messagingSenderId: '704949966382',
    appId: '1:704949966382:web:67e526089bfde5a6c7f1bf',
  },
  demoDatasetUrl: 'assets/artist-business-manager-data-test.json',
};
