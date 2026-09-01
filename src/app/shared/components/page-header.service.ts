import { Injectable, signal } from '@angular/core';

export interface PageHeaderAction {
  readonly key: string;
  readonly label: string;
}

/** Stato condiviso che permette a ogni pagina di pubblicare icona/titolo/azioni nell'header generale dell'app. */
@Injectable({ providedIn: 'root' })
export class PageHeaderService {
  readonly icon = signal('');
  readonly title = signal('');
  readonly actions = signal<readonly PageHeaderAction[]>([]);
  readonly hidden = signal(false);
  private handler: ((key: string) => void) | null = null;

  configure(icon: string, title: string, actions: readonly PageHeaderAction[], hidden: boolean, onSelect: (key: string) => void): void {
    this.icon.set(icon);
    this.title.set(title);
    this.actions.set(actions);
    this.hidden.set(hidden);
    this.handler = onSelect;
  }

  select(key: string): void {
    this.handler?.(key);
  }

  reset(): void {
    this.icon.set('');
    this.title.set('');
    this.actions.set([]);
    this.hidden.set(false);
    this.handler = null;
  }
}
