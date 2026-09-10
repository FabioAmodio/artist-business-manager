import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  protected readonly confirmation = inject(ConfirmDialogService);
  @ViewChild('dialog') private dialog?: ElementRef<HTMLDialogElement>;

  constructor() {
    effect(() => {
      const request = this.confirmation.request();
      const dialog = this.dialog?.nativeElement;
      if (request) {
        setTimeout(() => {
          const renderedDialog = this.dialog?.nativeElement;
          if (this.confirmation.request() && renderedDialog && !renderedDialog.open) renderedDialog.showModal();
        });
      }
      if (!request && dialog?.open) dialog.close();
    });
  }

  protected cancel(event: Event): void {
    event.preventDefault();
    this.confirmation.answer(false);
  }
}
