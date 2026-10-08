import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, effect, inject } from '@angular/core';
import { ContactActionSheetService } from './contact-action-sheet.service';
import { buildContactSheetActions, type ContactSheetAction } from '../../utils/contact-links';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contact-action-sheet',
  templateUrl: './contact-action-sheet.component.html',
  styleUrl: './contact-action-sheet.component.scss',
})
export class ContactActionSheetComponent {
  protected readonly sheet = inject(ContactActionSheetService);
  @ViewChild('dialog') private dialog?: ElementRef<HTMLDialogElement>;

  /** Il preferito (se presente) va in cima, poi i recapiti del Party, infine le azioni derivate dal contesto (posizione fiera, prenotazione hotel). */
  protected readonly actions = computed<readonly ContactSheetAction[]>(() => {
    const party = this.sheet.party();
    if (!party) return [];
    const list = buildContactSheetActions(party);
    const sorted = [...list].sort((first, second) => Number(second.preferred) - Number(first.preferred));
    return [...sorted, ...this.sheet.extraActions()];
  });

  constructor() {
    effect(() => {
      const party = this.sheet.party();
      const dialog = this.dialog?.nativeElement;
      if (party) {
        setTimeout(() => {
          const renderedDialog = this.dialog?.nativeElement;
          if (this.sheet.party() && renderedDialog && !renderedDialog.open) renderedDialog.showModal();
        });
      }
      if (!party && dialog?.open) dialog.close();
    });
  }

  protected cancel(event: Event): void {
    event.preventDefault();
    this.sheet.close();
  }

  protected runAction(action: ContactSheetAction): void {
    if (action.external) window.open(action.href, '_blank', 'noopener');
    else window.location.href = action.href;
    this.sheet.close();
  }
}
