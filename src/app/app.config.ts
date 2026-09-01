import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { AppStateService } from './core/state/app-state.service';
import { AppNavigationService } from './core/navigation/app-navigation.service';
import { AppErrorHandler } from './core/error/error-handler';
import { routes } from './app.routes';
import { environmentProviders } from './core/configuration/environment.providers';
import { STORAGE_PROVIDER } from './core/configuration/environment.tokens';
import { PersistenceService } from './application/persistence/persistence.service';
import { ActiveFairService } from './core/event/active-fair.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    AppStateService,
    AppNavigationService,
    {
      provide: ErrorHandler,
      useClass: AppErrorHandler,
    },
    provideAppInitializer(() => {
      const appState = inject(AppStateService);
      const storage = inject(STORAGE_PROVIDER);
      const persistence = inject(PersistenceService);
      const activeFair = inject(ActiveFairService);

      return storage.open().then(
        async () => {
          await persistence.initialize();
          await activeFair.initialize();
          appState.notifyDatabaseReady();
        },
        (error) => {
          console.error('Database initialization failed:', error);
          appState.notifyDatabaseError();
        },
      );
    }),
    ...environmentProviders,
  ],
};

