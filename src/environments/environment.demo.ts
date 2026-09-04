import type { AppEnvironment } from '../app/core/configuration/app-environment';

export const environment: AppEnvironment = {
  applicationName: 'Artist Business Manager',
  environmentName: 'demo',
  storagePrefix: 'ABM-DEMO',
  logLevel: 'info',
  syncEnabled: false,
  allowExternalPersistence: false,
  allowImportExport: true,
  allowCloudSync: false,
  version: '0.0.0',
  defaultPersistenceMode: 'offline',
  firebase: {
    apiKey: 'AIzaSyD5ZYafNo4WwxD2Xd8nVfR8uOrymJKeqD8',
    authDomain: 'artist-business-manager-demo.firebaseapp.com',
    projectId: 'artist-business-manager-demo',
    storageBucket: 'artist-business-manager-demo.firebasestorage.app',
    messagingSenderId: '203505781385',
    appId: '1:203505781385:web:908cecdc27129ede851458',
  },
  demoDatasetUrl: 'assets/artist-business-manager-data-test.json',
};