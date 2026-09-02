import { Injectable, signal } from '@angular/core';

export interface PageHeaderAction {
  readonly key: string;
  readonly label: string;
  readonly icon?: string;
  readonly mobileOnly?: boolean;
}

export interface PageHeaderFilterOption {
  readonly value: string;
  readonly label: string;
}

/** Stato condiviso che permette a ogni pagina di pubblicare icona/titolo/azioni nell'header generale dell'app. */
@Injectable({ providedIn: 'root' })
export class PageHeaderService {
  readonly icon = signal('');
  readonly title = signal('');
  readonly actions = signal<readonly PageHeaderAction[]>([]);
  readonly hidden = signal(false);
  readonly filterOptions = signal<readonly PageHeaderFilterOption[]>([]);
  readonly filterValue = signal('');
  readonly filterLabel = signal('Anno');
  readonly filterReplacesTitle = signal(false);
  private handler: ((key: string) => void) | null = null;
  private filterHandler: ((value: string) => void) | null = null;

  configure(icon: string, title: string, actions: readonly PageHeaderAction[], hidden: boolean, filterOptions: readonly PageHeaderFilterOption[], filterValue: string, filterLabel: string, filterReplacesTitle: boolean, onSelect: (key: string) => void, onFilterChange: (value: string) => void): void {
    this.icon.set(icon);
    this.title.set(title);
    this.actions.set(actions);
    this.hidden.set(hidden);
    this.filterOptions.set(filterOptions);
    this.filterValue.set(filterValue);
    this.filterLabel.set(filterLabel);
    this.filterReplacesTitle.set(filterReplacesTitle);
    this.handler = onSelect;
    this.filterHandler = onFilterChange;
  }

  select(key: string): void {
    this.handler?.(key);
  }

  changeFilter(value: string): void {
    this.filterHandler?.(value);
  }

  reset(): void {
    this.icon.set('');
    this.title.set('');
    this.actions.set([]);
    this.hidden.set(false);
    this.filterOptions.set([]);
    this.filterValue.set('');
    this.filterLabel.set('Anno');
    this.filterReplacesTitle.set(false);
    this.handler = null;
    this.filterHandler = null;
  }
}
