import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form-actions',
  templateUrl: './form-actions.component.html',
  styleUrl: './form-actions.component.scss',
})
export class FormActionsComponent {
  readonly disabled = input(false);
  readonly saving = input(false);
  readonly saveLabel = input('Salva');
  readonly cancel = output<void>();
}
