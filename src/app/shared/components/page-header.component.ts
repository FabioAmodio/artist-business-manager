import { Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { PageHeaderService, type PageHeaderAction, type PageHeaderFilterOption } from './page-header.service';

export type { PageHeaderAction, PageHeaderFilterOption };

/** Non renderizza nulla: pubblica icona/titolo/azioni nell'header generale tramite PageHeaderService. */
@Component({
  selector: 'app-page-header',
  template: '',
})
export class PageHeaderComponent {
  private readonly pageHeader = inject(PageHeaderService);

  readonly icon = input('');
  readonly title = input.required<string>();
  readonly actions = input<ReadonlyArray<PageHeaderAction>>([]);
  readonly hidden = input(false);
  readonly filterOptions = input<ReadonlyArray<PageHeaderFilterOption>>([]);
  readonly filterValue = input('');
  readonly select = output<string>();
  readonly filterChange = output<string>();

  constructor() {
    effect(() => {
      this.pageHeader.configure(this.icon(), this.title(), this.actions(), this.hidden(), this.filterOptions(), this.filterValue(), (key) => this.select.emit(key), (value) => this.filterChange.emit(value));
    });
    inject(DestroyRef).onDestroy(() => this.pageHeader.reset());
  }
}
