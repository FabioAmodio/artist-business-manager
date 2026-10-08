import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import { FairContactsDialogService } from './fair-contacts-dialog.service';
import { ActiveFairService } from '../../../core/event/active-fair.service';
import { FairTaskService } from '../../../application/fairs/fair-task.service';
import { ContactService } from '../../../application/contacts/contact.service';
import { ContactActionSheetService } from '../contact-action-sheet/contact-action-sheet.service';
import { buildFairContextActions } from '../../utils/fair-contact-context';
import { buildMapsSearchUrl } from '../../utils/maps-links';
import type { Party } from '../../../domain/models/party';
import type { FairTaskContactRole } from '../../../domain/models/fair-task';

interface FairContactRow {
  readonly party: Party;
  readonly contactRole: FairTaskContactRole;
}

const ROLE_LABELS: Record<FairTaskContactRole, string> = { organizer: 'Organizzatore', hotel: 'Hotel' };
const ROLE_ICONS: Record<FairTaskContactRole, string> = { organizer: '🎪', hotel: '🏨' };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fair-contacts-dialog',
  templateUrl: './fair-contacts-dialog.component.html',
  styleUrl: './fair-contacts-dialog.component.scss',
})
export class FairContactsDialogComponent {
  protected readonly dialogService = inject(FairContactsDialogService);
  private readonly activeFairService = inject(ActiveFairService);
  private readonly fairTaskService = inject(FairTaskService);
  private readonly contactService = inject(ContactService);
  private readonly contactSheet = inject(ContactActionSheetService);
  @ViewChild('dialog') private dialog?: ElementRef<HTMLDialogElement>;

  protected readonly roleLabels = ROLE_LABELS;
  protected readonly roleIcons = ROLE_ICONS;
  protected readonly loading = signal(false);
  protected readonly rows = signal<readonly FairContactRow[]>([]);

  constructor() {
    effect(() => {
      const open = this.dialogService.isOpen();
      const dialog = this.dialog?.nativeElement;
      if (open) {
        void this.load();
        setTimeout(() => {
          const renderedDialog = this.dialog?.nativeElement;
          if (this.dialogService.isOpen() && renderedDialog && !renderedDialog.open) renderedDialog.showModal();
        });
      }
      if (!open && dialog?.open) dialog.close();
    });
  }

  protected fair() { return this.activeFairService.activeFair(); }
  protected mapsUrl(): string | undefined {
    const location = this.fair()?.location;
    return location?.trim() ? buildMapsSearchUrl(location) : undefined;
  }

  protected cancel(event: Event): void {
    event.preventDefault();
    this.dialogService.close();
  }

  protected openRow(row: FairContactRow): void {
    this.contactSheet.open(row.party, buildFairContextActions(this.fair() ?? undefined, row.contactRole));
  }

  /** Organizzatore/hotel collegati ai task di QUESTA edizione (stessa aggregazione gia' usata altrove), deduplicati per ruolo+party. */
  private async load(): Promise<void> {
    const fair = this.fair();
    if (!fair) { this.rows.set([]); return; }
    this.loading.set(true);
    try {
      const [tasks, contacts] = await Promise.all([this.fairTaskService.listByFairEdition(fair.id), this.contactService.list()]);
      const contactsById = new Map(contacts.map((party) => [party.id, party]));
      const seen = new Set<string>();
      const rows: FairContactRow[] = [];
      for (const task of tasks) {
        if (!task.partyId || !task.contactRole) continue;
        const key = `${task.contactRole}:${task.partyId}`;
        if (seen.has(key)) continue;
        const party = contactsById.get(task.partyId);
        if (!party) continue;
        seen.add(key);
        rows.push({ party, contactRole: task.contactRole });
      }
      this.rows.set(rows);
    } finally {
      this.loading.set(false);
    }
  }
}
