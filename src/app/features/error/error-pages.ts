import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { signal } from '@angular/core';

/**
 * Global application error state and notifications.
 * Replaces a global error handler service but without persistence logic.
 */
export class AppError {
  readonly id = crypto.randomUUID();
  readonly timestamp = Date.now();
  readonly dismissed = signal(false);

  constructor(
    readonly message: string,
    readonly context?: Record<string, unknown>,
    readonly severity: 'error' | 'warning' | 'info' = 'error',
  ) {}
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-not-found-page',
  templateUrl: './not-found-page.html',
  styleUrl: './error-pages.scss',
  standalone: true,
  imports: [RouterLink],
})
export class NotFoundPage {
  protected readonly statusCode = '404';
  protected readonly title = 'Pagina non trovata';
  protected readonly description = 'La pagina che stai cercando non esiste o è stata spostata.';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-error-page',
  templateUrl: './error-page.html',
  styleUrl: './error-pages.scss',
  standalone: true,
  imports: [RouterLink],
})
export class ErrorPage {
  protected readonly title = 'Errore applicativo';
  protected readonly description = 'Si è verificato un errore inatteso. Riprova più tardi o contatta il supporto.';
}

