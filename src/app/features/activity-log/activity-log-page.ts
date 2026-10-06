import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivityLogService } from '../../application/activity-log/activity-log.service';
import { FairService } from '../../application/fairs/fair.service';
import { PersistenceService } from '../../application/persistence/persistence.service';
import type { ActivityLogEntry } from '../../domain/models/activity-log';
import type { PartyContactChannel } from '../../domain/models/party';
import type { Fair } from '../../domain/models/fair';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { FormActionsComponent } from '../../shared/components/form-actions.component';
import { SwipeRowComponent } from '../../shared/components/swipe-row/swipe-row.component';
import type { SwipeAction } from '../../shared/components/swipe-row/swipe-row.model';

const CHANNEL_LABELS: Record<string, string> = { email: 'Email', phone: 'Telefono', whatsapp: 'WhatsApp', website: 'Sito web' };

interface ActivityLogDraft {
  readonly date: string;
  readonly title: string;
  readonly contactName: string;
  readonly contactChannel: PartyContactChannel | '';
  readonly contactValue: string;
  readonly notes: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, FormActionsComponent, SwipeRowComponent],
  selector: 'app-activity-log-page',
  templateUrl: './activity-log-page.html',
  styleUrl: './activity-log-page.scss',
})
export class ActivityLogPage implements OnInit {
  private readonly router = inject(Router);
  private readonly activityLogService = inject(ActivityLogService);
  private readonly fairService = inject(FairService);
  private readonly persistence = inject(PersistenceService);

  protected readonly entries = signal<readonly ActivityLogEntry[]>([]);
  protected readonly fairs = signal<readonly Fair[]>([]);
  protected readonly loading = signal(true);
  protected readonly fairFilter = signal('');
  protected readonly query = signal('');
  protected readonly openRowId = signal<string | null>(null);
  protected readonly editingEntry = signal<ActivityLogEntry | null>(null);
  protected editDraft: ActivityLogDraft = this.emptyDraft();
  protected readonly channelKinds: readonly PartyContactChannel[] = ['email', 'phone', 'whatsapp', 'website'];
  protected readonly channelLabels = CHANNEL_LABELS;

  ngOnInit(): void { void this.load(); }

  protected isMobileSwipeMode(): boolean { return this.persistence.listInteractionMode() === 'swipe' && typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true; }

  protected visibleEntries(): readonly ActivityLogEntry[] {
    const query = this.query().trim().toLocaleLowerCase();
    const filterId = this.fairFilter();
    return this.entries()
      .filter((entry) => !filterId || entry.subjectId === filterId)
      .filter((entry) => !query || `${entry.title} ${entry.contactName ?? ''} ${entry.contactValue ?? ''} ${entry.notes ?? ''}`.toLocaleLowerCase().includes(query))
      .slice()
      .sort((first, second) => second.date.localeCompare(first.date));
  }

  protected fairName(entry: ActivityLogEntry): string {
    const fair = this.fairs().find((item) => item.id === entry.subjectId);
    return fair ? `${fair.name} · ${fair.edition}` : 'Fiera non trovata';
  }

  protected channelLabel(entry: ActivityLogEntry): string {
    return entry.contactChannel ? CHANNEL_LABELS[entry.contactChannel] ?? entry.contactChannel : '';
  }

  protected openFair(entry: ActivityLogEntry): void {
    void this.router.navigate(['/events'], { queryParams: { open: entry.subjectId } });
  }

  protected openEdit(entry: ActivityLogEntry): void { this.editDraft = this.draftFromEntry(entry); this.editingEntry.set(entry); }
  protected cancelEdit(): void { this.editingEntry.set(null); }

  private emptyDraft(): ActivityLogDraft { return { date: '', title: '', contactName: '', contactChannel: '', contactValue: '', notes: '' }; }
  private draftFromEntry(entry: ActivityLogEntry): ActivityLogDraft {
    return { date: entry.date, title: entry.title, contactName: entry.contactName ?? '', contactChannel: entry.contactChannel ?? '', contactValue: entry.contactValue ?? '', notes: entry.notes ?? '' };
  }

  protected rightActions(entry: ActivityLogEntry): SwipeAction[] {
    return [
      { key: 'open', icon: '📅', label: 'Apri fiera', run: () => this.openFair(entry) },
      { key: 'edit', icon: '✎', label: 'Modifica', kind: 'auto', run: () => this.openEdit(entry) },
    ];
  }

  protected leftActions(entry: ActivityLogEntry): SwipeAction[] {
    return [{ key: 'delete', icon: '🗑', label: 'Elimina', variant: 'danger', kind: 'auto', run: () => this.deleteEntry(entry) }];
  }

  protected async saveEntry(): Promise<void> {
    const entry = this.editingEntry();
    if (!entry) return;
    const draft = this.editDraft;
    const updated = await this.activityLogService.update(entry.id, {
      subjectType: entry.subjectType, subjectId: entry.subjectId, sourceTaskId: entry.sourceTaskId,
      date: draft.date, title: draft.title.trim(), contactName: draft.contactName || undefined,
      contactChannel: draft.contactChannel || undefined, contactValue: draft.contactValue || undefined, notes: draft.notes || undefined,
    });
    this.entries.update((entries) => entries.map((item) => item.id === updated.id ? updated : item));
    this.editingEntry.set(null);
  }

  protected async deleteEntry(entry: ActivityLogEntry): Promise<void> {
    await this.activityLogService.delete(entry.id);
    this.entries.update((entries) => entries.filter((item) => item.id !== entry.id));
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [entries, fairs] = await Promise.all([this.activityLogService.listAll(), this.fairService.list()]);
      this.entries.set(entries);
      this.fairs.set([...fairs].sort((first, second) => (second.startDate ?? '').localeCompare(first.startDate ?? '')));
    } finally { this.loading.set(false); }
  }
}

