import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';

/**
 * Global error handler for uncaught application errors.
 * Non-invasive: logs to console without blocking the app.
 */
@Injectable()
export class AppErrorHandler implements ErrorHandler {
  constructor(
    private readonly injector: Injector,
    private readonly ngZone: NgZone,
  ) {}

  handleError(error: Error | any): void {
    if (error instanceof Error) {
      this.ngZone.run(() => {
        console.error('Application Error:', error.message, error);
      });
    } else {
      console.error('Unknown Error:', error);
    }
  }
}

/**
 * Predefined error messages for common application scenarios.
 */
export const ErrorMessages = {
  PERSISTENCE_OFFLINE: 'Database offline. Le modifiche potrebbero non essere salvate.',
  PERSISTENCE_QUOTA_EXCEEDED: 'Quota di memoria esaurita. Eliminare dati o esportare un backup.',
  PERSISTENCE_UNKNOWN: 'Errore del database locale. Verificare le impostazioni del browser.',
  NOT_FOUND: 'La risorsa richiesta non esiste.',
  UNAUTHORIZED: 'Non autorizzato a accedere a questa risorsa.',
  FORBIDDEN: 'Accesso negato.',
  SERVER_ERROR: 'Si è verificato un errore del server. Riprova più tardi.',
  UNKNOWN_ERROR: 'Si è verificato un errore inatteso. Riprova più tardi.',
};
