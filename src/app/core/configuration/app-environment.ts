export interface FirebaseEnvironmentConfig {
  readonly apiKey: string;
  readonly authDomain: string;
  readonly projectId: string;
  readonly storageBucket: string;
  readonly messagingSenderId: string;
  readonly appId: string;
}

export interface AppEnvironment {
  readonly applicationName: string;
  readonly environmentName: 'test' | 'demo' | 'release';
  readonly storagePrefix: string;
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
  readonly syncEnabled: boolean;
  readonly allowExternalPersistence: boolean;
  readonly allowImportExport: boolean;
  readonly allowCloudSync: boolean;
  readonly version: string;
  readonly defaultPersistenceMode: 'offline' | 'firestore';
  readonly firebase?: FirebaseEnvironmentConfig;
  readonly demoDatasetUrl?: string;
  readonly futureEndpoint?: string;
  readonly googleDriveClientId?: string;
}
