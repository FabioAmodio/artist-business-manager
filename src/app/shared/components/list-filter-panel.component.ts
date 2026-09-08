import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-list-filter-panel',
  templateUrl: './list-filter-panel.component.html',
  styleUrl: './list-filter-panel.component.scss',
})
export class ListFilterPanelComponent {
  readonly title = input('Filtra');
  readonly resultLabel = input<string | null>(null);
  readonly close = output<void>();
  readonly reset = output<void>();
  readonly apply = output<void>();
}
