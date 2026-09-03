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
  readonly demoDatasetUrl?: string;
  readonly futureEndpoint?: string;
  readonly googleDriveClientId?: string;
}
