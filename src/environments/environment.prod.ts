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
  defaultPersistenceMode: 'offline',
  firebase: {
    apiKey: 'AIzaSyD_W3Kx5oSd34pZ3ceXHhM_bjQ5fNMaaG0',
    authDomain: 'artist-business-manager-prod.firebaseapp.com',
    projectId: 'artist-business-manager-prod',
    storageBucket: 'artist-business-manager-prod.firebasestorage.app',
    messagingSenderId: '787192121257',
    appId: '1:787192121257:web:08fdb6f530cf5f5526e6b8',
  },
};
