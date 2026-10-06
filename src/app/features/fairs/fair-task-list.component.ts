import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FairTaskService } from '../../application/fairs/fair-task.service';
import { ContactService } from '../../application/contacts/contact.service';
import { ActivityLogService } from '../../application/activity-log/activity-log.service';
import type { ActivityLogEntry } from '../../domain/models/activity-log';
import type { FairSeriesTaskTemplateItem, FairTaskKind } from '../../domain/models/fair';
import type { FairTask, FairTaskContactRole, FairTaskStatus } from '../../domain/models/fair-task';
import type { Party, PartyContactChannel } from '../../domain/models/party';
import { GLOBAL_DEFAULT_TEMPLATE, HOTEL_TASK_KINDS, missingDefaultFairTaskKinds } from '../../domain/shared/fair-task-template';
import { contactLinksForChannel, contactLinksFromFreeText, type ContactLinks } from '../../shared/utils/contact-links';
import { SwipeRowComponent } from '../../shared/components/swipe-row/swipe-row.component';
import type { SwipeAction } from '../../shared/components/swipe-row/swipe-row.model';

const KIND_LABELS: Record<FairTaskKind, string> = {
  'contact-organizer': "Contattare l'organizzatore",
  'await-reply': 'Attendere risposta',
  'send-application': 'Inviare modulistica di iscrizione',
  'pay-fee': 'Pagare la quota di partecipazione',
  'send-promo-material': 'Inviare materiale promozionale',
  'book-hotel': "Prenotare l'hotel",
  'hotel-cancellation-deadline': 'Scadenza cancellazione hotel',
  custom: 'Attivita libera',
};

const CONTACT_ROLE_LABELS: Record<FairTaskContactRole, string> = { organizer: 'Organizzatore', hotel: 'Hotel' };
const CHANNEL_LABELS: Record<PartyContactChannel, string> = { email: 'Email', phone: 'Telefono', whatsapp: 'WhatsApp', website: 'Sito web' };
const STATUS_OPTIONS: readonly { readonly status: FairTaskStatus; readonly icon: string; readonly label: string }[] = [
  { status: 'pending', icon: '📝', label: 'Da fare' },
  { status: 'done', icon: '✓', label: 'Fatta' },
  { status: 'not-needed', icon: '🚫', label: 'Da non fare' },
];

interface ChannelOption {
  readonly channel: PartyContactChannel;
  /** Id del PartyContactMethod specifico quando non e' il campo principale del Party per quel canale (consente piu' email/telefoni distinti). */
  readonly methodId?: string;
  readonly value: string;
  readonly label: string;
}

interface TaskDraft {
  readonly dueDate: string;
  readonly contactRole: FairTaskContactRole;
  readonly partyId: string;
  readonly contactChannel: PartyContactChannel | '';
  readonly contactMethodId: string;
  readonly contactInfo: string;
  readonly notes: string;
}

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
  imports: [FormsModule, SwipeRowComponent],
  selector: 'app-fair-task-list',
  templateUrl: './fair-task-list.component.html',
  styleUrl: './fair-task-list.component.scss',
})
export class FairTaskListComponent {
  readonly fairEditionId = input.required<string>();
  readonly seriesTaskTemplate = input<readonly FairSeriesTaskTemplateItem[] | undefined>(undefined);
  readonly readonlyMode = input(false, { alias: 'readonly' });

  private readonly service = inject(FairTaskService);
  private readonly contactService = inject(ContactService);
  private readonly activityLogService = inject(ActivityLogService);

  protected readonly tasks = signal<readonly FairTask[]>([]);
  protected readonly organizerContacts = signal<readonly Party[]>([]);
  protected readonly hotelContacts = signal<readonly Party[]>([]);
  protected readonly contactRoleLabels = CONTACT_ROLE_LABELS;
  protected readonly channelLabels = CHANNEL_LABELS;
  protected readonly channelKinds: readonly PartyContactChannel[] = ['email', 'phone', 'whatsapp', 'website'];
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly addingTask = signal(false);
  protected readonly openRowId = signal<string | null>(null);
  protected readonly taskDrafts = signal<Record<string, TaskDraft>>({});
  protected readonly collapsedTaskIds = signal<ReadonlySet<string>>(new Set());
  protected newTaskTitle = '';
  protected readonly hasTasks = computed(() => this.tasks().length > 0);
  protected readonly activityLog = signal<readonly ActivityLogEntry[]>([]);
  protected readonly showActivityLog = signal(false);
  protected readonly activityLogLoading = signal(false);
  protected readonly activityLogDrafts = signal<Record<string, ActivityLogDraft>>({});
  protected readonly addingLogEntry = signal(false);
  protected newLogDraft: ActivityLogDraft = this.emptyLogDraft();
  /** Attivita standard non ancora presenti ma proponibili ora: se vuoto il pulsante "aggiungi mancanti" non serve. */
  protected readonly hasAddableDefaults = computed(() => missingDefaultFairTaskKinds(this.tasks(), this.seriesTaskTemplate()).length > 0);
  /** I task liberi restano sempre in coda a quelli standard, che seguono l'ordine del template (riflette anche le dipendenze). */
  protected readonly orderedTasks = computed(() => {
    const template = this.seriesTaskTemplate()?.length ? this.seriesTaskTemplate()! : GLOBAL_DEFAULT_TEMPLATE;
    const templateOrder = new Map(template.map((item, index) => [item.kind, index]));
    return [...this.tasks()].sort((first, second) => {
      const firstOrder = first.kind === 'custom' ? Number.MAX_SAFE_INTEGER : templateOrder.get(first.kind) ?? Number.MAX_SAFE_INTEGER;
      const secondOrder = second.kind === 'custom' ? Number.MAX_SAFE_INTEGER : templateOrder.get(second.kind) ?? Number.MAX_SAFE_INTEGER;
      return firstOrder - secondOrder;
    });
  });
  private readonly contactsById = computed(() => new Map([...this.organizerContacts(), ...this.hotelContacts()].map((party) => [party.id, party])));

  constructor() {
    effect(() => { const id = this.fairEditionId(); void this.load(id); });
    void this.loadContacts();
  }

  protected kindLabel(task: FairTask): string { return task.kind === 'custom' ? task.title : KIND_LABELS[task.kind] ?? task.title; }

  protected currentStatusOption(task: FairTask) { return this.statusOptions.find((option) => option.status === task.status) ?? this.statusOptions[0]; }
  protected isCollapsed(task: FairTask): boolean { return this.collapsedTaskIds().has(task.id); }
  protected toggleCollapse(task: FairTask): void {
    this.collapsedTaskIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(task.id)) next.delete(task.id); else next.add(task.id);
      return next;
    });
  }

  /** Pool di contatti per il tipo scelto sul task: organizzatori e hotel non vengono mai mischiati nella stessa combo. */
  protected contactOptions(task: FairTask): readonly Party[] {
    return this.draft(task).contactRole === 'hotel' ? this.hotelContacts() : this.organizerContacts();
  }

  /** Usa la bozza non ancora salvata, cosi' le icone di contatto (mail/telefono/whatsapp) compaiono subito mentre si digita/seleziona, non solo dopo il salvataggio. */
  protected contactLinks(task: FairTask): ContactLinks {
    const draft = this.draft(task);
    if (draft.partyId && draft.contactChannel) {
      const party = this.contactsById().get(draft.partyId);
      const option = this.channelOptionsForParty(party).find((item) => item.channel === draft.contactChannel && (item.methodId ?? '') === (draft.contactMethodId ?? ''));
      if (option) return contactLinksForChannel(draft.contactChannel, option.value);
    }
    return contactLinksFromFreeText(draft.contactInfo);
  }

  protected channelOptions(task: FairTask): readonly ChannelOption[] {
    const draft = this.draft(task);
    return this.channelOptionsForParty(this.contactsById().get(draft.partyId));
  }

  /** Valore unico per il binding del select "Canale": il methodId quando presente, altrimenti il solo channel (campo principale del Party). */
  protected channelOptionKey(option: ChannelOption): string { return option.methodId ? `${option.channel}:${option.methodId}` : option.channel; }
  protected channelSelectValue(task: FairTask): string { const draft = this.draft(task); return draft.contactMethodId ? `${draft.contactChannel}:${draft.contactMethodId}` : draft.contactChannel; }
  protected changeDraftChannel(task: FairTask, key: string): void {
    const option = this.channelOptions(task).find((item) => this.channelOptionKey(item) === key);
    this.updateDraft(task, { contactChannel: option?.channel ?? '', contactMethodId: option?.methodId ?? '' });
  }

  private channelOptionsForParty(party: Party | undefined): ChannelOption[] {
    if (!party) return [];
    const options: ChannelOption[] = [];
    if (party.email) options.push({ channel: 'email', value: party.email, label: CHANNEL_LABELS.email });
    if (party.phone) {
      options.push({ channel: 'phone', value: party.phone, label: CHANNEL_LABELS.phone });
      options.push({ channel: 'whatsapp', value: party.phone, label: CHANNEL_LABELS.whatsapp });
    }
    if (party.website) options.push({ channel: 'website', value: party.website, label: CHANNEL_LABELS.website });
    for (const method of party.contacts ?? []) {
      /* Evita solo i duplicati esatti (stesso canale e stesso valore): recapiti diversi dello stesso canale (es. due email) restano entrambi selezionabili. */
      if (options.some((option) => option.channel === method.channel && option.value === method.value)) continue;
      options.push({ channel: method.channel, methodId: method.id, value: method.value, label: `${CHANNEL_LABELS[method.channel]}${method.label ? ' (' + method.label + ')' : ''}` });
    }
    return options;
  }

  protected formatTimestamp(value?: string): string {
    return value ? new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '';
  }

  protected async generateDefaults(): Promise<void> {
    this.errorMessage.set('');
    const existingIds = new Set(this.tasks().map((task) => task.id));
    try {
      await this.service.createDefaults(this.fairEditionId(), this.seriesTaskTemplate());
      await this.load(this.fairEditionId());
      this.expandTasksNotIn(existingIds);
    }
    catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile generare la checklist.'); }
  }

  protected async changeStatus(task: FairTask, status: FairTaskStatus): Promise<void> {
    try {
      const affected = await this.service.setStatus(task.id, status);
      for (const updated of affected) this.applyTaskUpdate(updated);
      /* Fatta/Da non fare si ripiegano automaticamente (anche la genealogia messa a cascata su Da non fare); riaprire un task lo riespande. */
      this.collapsedTaskIds.update((ids) => {
        const next = new Set(ids);
        for (const updated of affected) {
          if (updated.status === 'done' || updated.status === 'not-needed') next.add(updated.id); else next.delete(updated.id);
        }
        return next;
      });
      if (status === 'done') {
        const unlocked = await this.service.unlockDependentTasks(this.fairEditionId(), task.kind, this.seriesTaskTemplate());
        if (unlocked.length) {
          this.tasks.update((tasks) => [...tasks, ...unlocked]);
          this.collapsedTaskIds.update((ids) => { const next = new Set(ids); for (const created of unlocked) next.delete(created.id); return next; });
        }
        void this.logTaskCompletion(task);
      }
    }
    catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile aggiornare lo stato.'); }
  }

  /** Registra nel log attivita' il completamento del task: una riga per ogni volta che si segna Fatta, duplicati inclusi (nessuna deduplica). */
  private async logTaskCompletion(task: FairTask): Promise<void> {
    const draft = this.draft(task);
    const party = draft.partyId ? this.contactsById().get(draft.partyId) : undefined;
    const option = party ? this.channelOptionsForParty(party).find((item) => item.channel === draft.contactChannel && (item.methodId ?? '') === (draft.contactMethodId ?? '')) : undefined;
    const entry = await this.activityLogService.logTaskCompletion(this.fairEditionId(), task.id, this.kindLabel(task), {
      name: party?.displayName,
      channel: option ? draft.contactChannel || undefined : undefined,
      value: option?.value ?? (draft.partyId ? undefined : draft.contactInfo || undefined),
    });
    if (this.showActivityLog()) this.activityLog.update((entries) => [entry, ...entries]);
  }

  /** Le nuove attivita' (appena generate/sbloccate/aggiunte) partono espanse; tutte le altre restano come caricate (collassate di default). */
  private expandTasksNotIn(existingIds: ReadonlySet<string>): void {
    this.collapsedTaskIds.update((ids) => {
      const next = new Set(ids);
      for (const task of this.tasks()) if (!existingIds.has(task.id)) next.delete(task.id);
      return next;
    });
  }

  protected taskRightActions(task: FairTask): SwipeAction[] {
    if (this.readonlyMode()) return [];
    const actions: SwipeAction[] = [];
    const contactAction = this.primaryContactAction(task);
    if (contactAction) actions.push(contactAction);
    actions.push(task.status === 'done'
      ? { key: 'reopen', icon: '↺', label: 'Riapri', variant: 'neutral', kind: 'auto', run: () => this.changeStatus(task, 'pending') }
      : { key: 'done', icon: '✓', label: 'Fatta', variant: 'neutral-success', kind: 'auto', run: () => this.changeStatus(task, 'done') });
    return actions;
  }

  /** Unica azione di contatto "predefinita" proposta nello slide: priorita' chiamata > email > whatsapp > sito. */
  private primaryContactAction(task: FairTask): SwipeAction | null {
    const links = this.contactLinks(task);
    if (links.callHref) return { key: 'call', icon: '📞', label: 'Chiama', run: () => { window.location.href = links.callHref!; } };
    if (links.mailHref) return { key: 'mail', icon: '✉️', label: 'Email', run: () => { window.location.href = links.mailHref!; } };
    if (links.whatsappHref) return { key: 'whatsapp', icon: '💬', label: 'WhatsApp', run: () => window.open(links.whatsappHref, '_blank', 'noopener') };
    if (links.websiteHref) return { key: 'website', icon: '🌐', label: 'Sito', run: () => window.open(links.websiteHref, '_blank', 'noopener') };
    return null;
  }

  protected taskLeftActions(task: FairTask): SwipeAction[] {
    if (this.readonlyMode()) return [];
    const actions: SwipeAction[] = [];
    if (task.status !== 'not-needed') actions.push({ key: 'not-needed', icon: '🚫', label: 'Da non fare', variant: 'neutral-warning', run: () => this.changeStatus(task, 'not-needed') });
    actions.push({ key: 'delete', icon: '🗑', label: 'Elimina', variant: 'danger', kind: 'auto', run: () => this.removeTask(task) });
    return actions;
  }

  /** Aggiorna il task in memoria senza ricaricare l'intera lista: evita di smontare il blocco @if/@else e far perdere il focus ai campi in modifica. */
  private applyTaskUpdate(updated: FairTask): void {
    this.tasks.update((tasks) => tasks.map((task) => task.id === updated.id ? updated : task));
  }

  private draftFromTask(task: FairTask): TaskDraft {
    return {
      dueDate: task.dueDate ?? '',
      contactRole: task.contactRole ?? (HOTEL_TASK_KINDS.has(task.kind) ? 'hotel' : 'organizer'),
      partyId: task.partyId ?? '',
      contactChannel: task.contactChannel ?? '',
      contactMethodId: task.contactMethodId ?? '',
      contactInfo: task.contactInfo ?? '',
      notes: task.notes ?? '',
    };
  }

  protected draft(task: FairTask): TaskDraft {
    return this.taskDrafts()[task.id] ?? this.draftFromTask(task);
  }

  protected updateDraft(task: FairTask, patch: Partial<TaskDraft>): void {
    this.taskDrafts.update((drafts) => ({ ...drafts, [task.id]: { ...this.draft(task), ...patch } }));
  }

  /** Cambiare il tipo di contatto svuota la selezione se il contatto scelto non appartiene al nuovo pool (organizzatore/hotel non si mischiano). */
  protected changeDraftContactRole(task: FairTask, contactRole: FairTaskContactRole): void {
    const pool = contactRole === 'hotel' ? this.hotelContacts() : this.organizerContacts();
    const draft = this.draft(task);
    const stillValid = pool.some((party) => party.id === draft.partyId);
    this.updateDraft(task, { contactRole, partyId: stillValid ? draft.partyId : '', contactChannel: stillValid ? draft.contactChannel : '' });
  }

  protected changeDraftParty(task: FairTask, partyId: string): void {
    const options = this.channelOptionsForParty(this.contactsById().get(partyId));
    const current = this.draft(task).contactChannel;
    const currentMethodId = this.draft(task).contactMethodId;
    const stillValid = options.some((option) => option.channel === current && (option.methodId ?? '') === currentMethodId);
    const fallback = options[0];
    this.updateDraft(task, {
      partyId,
      contactChannel: stillValid ? current : (fallback?.channel ?? ''),
      contactMethodId: stillValid ? currentMethodId : (fallback?.methodId ?? ''),
    });
  }

  protected isDirty(task: FairTask): boolean {
    const draft = this.taskDrafts()[task.id];
    if (!draft) return false;
    const committed = this.draftFromTask(task);
    return draft.dueDate !== committed.dueDate || draft.contactRole !== committed.contactRole || draft.partyId !== committed.partyId || draft.contactChannel !== committed.contactChannel
      || draft.contactMethodId !== committed.contactMethodId || draft.contactInfo !== committed.contactInfo || draft.notes !== committed.notes;
  }

  protected async saveTask(task: FairTask): Promise<void> {
    const draft = this.draft(task);
    try {
      const updated = await this.service.update(task.id, {
        kind: task.kind,
        title: task.title,
        dueDate: draft.dueDate || undefined,
        contactRole: draft.contactRole,
        partyId: draft.partyId || undefined,
        contactChannel: draft.contactChannel || undefined,
        contactMethodId: draft.contactMethodId || undefined,
        contactInfo: draft.contactInfo || undefined,
        notes: draft.notes || undefined,
      });
      this.applyTaskUpdate(updated);
      this.taskDrafts.update((drafts) => { const next = { ...drafts }; delete next[task.id]; return next; });
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il task.'); }
  }

  protected startAddingTask(): void { this.newTaskTitle = ''; this.addingTask.set(true); }
  protected cancelAddingTask(): void { this.addingTask.set(false); }

  protected async confirmAddTask(): Promise<void> {
    if (!this.newTaskTitle.trim()) return;
    const existingIds = new Set(this.tasks().map((task) => task.id));
    try {
      await this.service.create(this.fairEditionId(), { kind: 'custom', title: this.newTaskTitle.trim(), contactRole: 'organizer' });
      this.addingTask.set(false);
      await this.load(this.fairEditionId());
      this.expandTasksNotIn(existingIds);
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile aggiungere il task.'); }
  }

  protected async removeTask(task: FairTask): Promise<void> {
    try { await this.service.delete(task.id); await this.load(this.fairEditionId()); }
    catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare il task.'); }
  }

  private async load(fairEditionId: string): Promise<void> {
    this.loading.set(true);
    try {
      const tasks = await this.service.listByFairEdition(fairEditionId);
      this.tasks.set(tasks);
      /* Tutte le attivita' caricate partono collassate: restano espanse solo quelle appena generate/sbloccate/aggiunte in questa sessione. */
      this.collapsedTaskIds.set(new Set(tasks.map((task) => task.id)));
    }
    catch { this.errorMessage.set('Impossibile caricare la checklist.'); }
    finally { this.loading.set(false); }
  }

  private async loadContacts(): Promise<void> {
    /* I contatti di un'attivita organizzativa sono Party con ruolo organizer o hotel: le due combo restano separate, mai mischiate. */
    try {
      const [organizers, hotels] = await Promise.all([this.contactService.list({ role: 'organizer' }), this.contactService.list({ role: 'hotel' })]);
      this.organizerContacts.set(organizers);
      this.hotelContacts.set(hotels);
    } catch { /* la checklist resta usabile con il solo testo libero se l'anagrafica non e disponibile */ }
  }

  /** Il registro attivita' resta nascosto finche' l'utente non lo richiede esplicitamente; caricato solo alla prima apertura. */
  protected async toggleActivityLog(): Promise<void> {
    const opening = !this.showActivityLog();
    this.showActivityLog.set(opening);
    if (opening && !this.activityLog().length) await this.loadActivityLog();
  }

  private async loadActivityLog(): Promise<void> {
    this.activityLogLoading.set(true);
    try {
      const entries = await this.activityLogService.listBySubject('fair', this.fairEditionId());
      this.activityLog.set([...entries].sort((first, second) => second.date.localeCompare(first.date)));
    } catch { this.errorMessage.set('Impossibile caricare il registro attivita.'); }
    finally { this.activityLogLoading.set(false); }
  }

  private emptyLogDraft(): ActivityLogDraft { return { date: new Date().toISOString().slice(0, 10), title: '', contactName: '', contactChannel: '', contactValue: '', notes: '' }; }

  private logDraftFromEntry(entry: ActivityLogEntry): ActivityLogDraft {
    return { date: entry.date, title: entry.title, contactName: entry.contactName ?? '', contactChannel: entry.contactChannel ?? '', contactValue: entry.contactValue ?? '', notes: entry.notes ?? '' };
  }

  protected logDraft(entry: ActivityLogEntry): ActivityLogDraft { return this.activityLogDrafts()[entry.id] ?? this.logDraftFromEntry(entry); }
  protected updateLogDraft(entry: ActivityLogEntry, patch: Partial<ActivityLogDraft>): void {
    this.activityLogDrafts.update((drafts) => ({ ...drafts, [entry.id]: { ...this.logDraft(entry), ...patch } }));
  }
  protected isLogDirty(entry: ActivityLogEntry): boolean {
    const draft = this.activityLogDrafts()[entry.id];
    if (!draft) return false;
    const committed = this.logDraftFromEntry(entry);
    return draft.date !== committed.date || draft.title !== committed.title || draft.contactName !== committed.contactName
      || draft.contactChannel !== committed.contactChannel || draft.contactValue !== committed.contactValue || draft.notes !== committed.notes;
  }

  protected async saveLogEntry(entry: ActivityLogEntry): Promise<void> {
    const draft = this.logDraft(entry);
    try {
      const updated = await this.activityLogService.update(entry.id, {
        subjectType: entry.subjectType, subjectId: entry.subjectId, sourceTaskId: entry.sourceTaskId,
        date: draft.date, title: draft.title.trim(), contactName: draft.contactName || undefined,
        contactChannel: draft.contactChannel || undefined, contactValue: draft.contactValue || undefined, notes: draft.notes || undefined,
      });
      this.activityLog.update((entries) => entries.map((item) => item.id === updated.id ? updated : item));
      this.activityLogDrafts.update((drafts) => { const next = { ...drafts }; delete next[entry.id]; return next; });
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare la voce di registro.'); }
  }

  protected async deleteLogEntry(entry: ActivityLogEntry): Promise<void> {
    try { await this.activityLogService.delete(entry.id); this.activityLog.update((entries) => entries.filter((item) => item.id !== entry.id)); }
    catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare la voce di registro.'); }
  }

  protected startAddingLogEntry(): void { this.newLogDraft = this.emptyLogDraft(); this.addingLogEntry.set(true); }
  protected cancelAddingLogEntry(): void { this.addingLogEntry.set(false); }

  protected async confirmAddLogEntry(): Promise<void> {
    if (!this.newLogDraft.title.trim()) return;
    try {
      const entry = await this.activityLogService.create({
        subjectType: 'fair', subjectId: this.fairEditionId(), date: this.newLogDraft.date, title: this.newLogDraft.title.trim(),
        contactName: this.newLogDraft.contactName || undefined, contactChannel: this.newLogDraft.contactChannel || undefined, contactValue: this.newLogDraft.contactValue || undefined,
      });
      this.activityLog.update((entries) => [entry, ...entries]);
      this.addingLogEntry.set(false);
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile aggiungere la voce di registro.'); }
  }
}
