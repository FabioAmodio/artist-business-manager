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
  template: `
    <section class="error-page" [attr.aria-live]="'polite'">
      <div class="error-content">
        <p class="eyebrow">{{ statusCode }}</p>
        <h1>{{ title }}</h1>
        <p class="description">{{ description }}</p>
        <a routerLink="/dashboard" class="action-link">Torna alla home</a>
      </div>
    </section>
  `,
  styles: `
    .error-page {
      border-top: 3px solid var(--color-status-error);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      padding: var(--spacing-8);
    }

    .error-content {
      max-width: 52rem;
      text-align: center;
    }

    .eyebrow {
      color: var(--color-text-secondary);
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      letter-spacing: var(--letter-spacing-wide);
      margin: 0 0 var(--spacing-6);
      text-transform: uppercase;
    }

    h1 {
      color: var(--color-primary);
      font-family: var(--font-serif);
      font-size: clamp(2rem, 5vw, 4rem);
      font-weight: var(--font-weight-regular);
      line-height: var(--line-height-tight);
      margin: 0 0 var(--spacing-5);
    }

    .description {
      color: var(--color-text-secondary);
      font-size: var(--font-size-lg);
      margin: 0 0 var(--spacing-8);
    }

    .action-link {
      background: var(--color-primary);
      color: var(--color-surface);
      display: inline-block;
      padding: var(--spacing-4) var(--spacing-8);
      border-radius: var(--radius-base);
      text-decoration: none;
      font-weight: var(--font-weight-medium);
      transition: background var(--transition-base);
    }

    .action-link:hover {
      background: var(--color-primary-light);
    }
  `,
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
  template: `
    <section class="error-page" [attr.aria-live]="'polite'">
      <div class="error-content">
        <p class="eyebrow">Errore</p>
        <h1>{{ title }}</h1>
        <p class="description">{{ description }}</p>
        <a routerLink="/dashboard" class="action-link">Torna alla home</a>
      </div>
    </section>
  `,
  styles: `
    .error-page {
      border-top: 3px solid var(--color-status-error);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      padding: var(--spacing-8);
    }

    .error-content {
      max-width: 52rem;
      text-align: center;
    }

    .eyebrow {
      color: var(--color-text-secondary);
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      letter-spacing: var(--letter-spacing-wide);
      margin: 0 0 var(--spacing-6);
      text-transform: uppercase;
    }

    h1 {
      color: var(--color-primary);
      font-family: var(--font-serif);
      font-size: clamp(2rem, 5vw, 4rem);
      font-weight: var(--font-weight-regular);
      line-height: var(--line-height-tight);
      margin: 0 0 var(--spacing-5);
    }

    .description {
      color: var(--color-text-secondary);
      font-size: var(--font-size-lg);
      margin: 0 0 var(--spacing-8);
    }

    .action-link {
      background: var(--color-primary);
      color: var(--color-surface);
      display: inline-block;
      padding: var(--spacing-4) var(--spacing-8);
      border-radius: var(--radius-base);
      text-decoration: none;
      font-weight: var(--font-weight-medium);
      transition: background var(--transition-base);
    }

    .action-link:hover {
      background: var(--color-primary-light);
    }
  `,
  standalone: true,
  imports: [RouterLink],
})
export class ErrorPage {
  protected readonly title = 'Errore applicativo';
  protected readonly description = 'Si è verificato un errore inatteso. Riprova più tardi o contatta il supporto.';
}

