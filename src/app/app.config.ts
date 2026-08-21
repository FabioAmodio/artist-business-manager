import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { AppDatabase } from './core/persistence/app-database';
import { AppStateService } from './core/state/app-state.service';
import { AppNavigationService } from './core/navigation/app-navigation.service';
import { AppErrorHandler } from './core/error/error-handler';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    AppDatabase,
    AppStateService,
    AppNavigationService,
    {
      provide: ErrorHandler,
      useClass: AppErrorHandler,
    },
    provideAppInitializer(() => {
      const db = inject(AppDatabase);
      const appState = inject(AppStateService);

      return db.openDatabase().then(
        () => {
          appState.notifyDatabaseReady();
        },
        (error) => {
          console.error('Database initialization failed:', error);
          appState.notifyDatabaseError();
        },
      );
    }),
  ],
};

