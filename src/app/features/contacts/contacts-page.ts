import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactService, type ContactInput } from '../../application/contacts/contact.service';
import { OperationService } from '../../application/operations/operation.service';
import { PurchaseService } from '../../application/purchases/purchase.service';
import type { Operation } from '../../domain/models/operation';
import type { Party, PartyContactChannel, PartyContactMethod, PartyRole, SupplierType } from '../../domain/models/party';
import type { Purchase } from '../../domain/models/purchase';
import { FormActionsComponent } from '../../shared/components/form-actions.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { ListFilterPanelComponent } from '../../shared/components/list-filter-panel.component';
import { NumberStepperComponent } from '../../shared/components/number-stepper.component';
import { SwipeRowComponent } from '../../shared/components/swipe-row/swipe-row.component';
import type { SwipeAction } from '../../shared/components/swipe-row/swipe-row.model';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog.service';
import { ContactActionSheetService } from '../../shared/components/contact-action-sheet/contact-action-sheet.service';
import { PARTY_CHANNEL_LABELS, partyContactOptions, type PartyContactOption } from '../../shared/utils/contact-links';

type ContactSortKey = 'name' | 'purchases' | 'spending' | 'type';

export const ROLE_OPTIONS: readonly PartyRole[] = ['customer', 'supplier', 'organizer', 'hotel', 'publisher', 'collaborator'];
export const ROLE_LABELS: Record<PartyRole, string> = {
  customer: 'Cliente',
  publisher: 'Editore',
  supplier: 'Fornitore',
  collaborator: 'Collaboratore',
  organizer: 'Organizzatore',
  hotel: 'Hotel',
};
export const ROLE_ICONS: Record<PartyRole, string> = {
  customer: '👥',
  publisher: '📚',
  supplier: '▣',
  collaborator: '🤝',
  organizer: '🎪',
  hotel: '🏨',
};
const SUPPLIER_TYPE_LABELS: Record<SupplierType, string> = {
  printer: 'Tipografia',
  publisher: 'Editore',
  materials: 'Materiali',
  marketplace: 'Marketplace',
  other: 'Altro fornitore',
};
export const CONTACT_CHANNEL_LABELS: Record<PartyContactChannel, string> = PARTY_CHANNEL_LABELS;
export const CONTACT_METHOD_CHANNEL_OPTIONS: readonly PartyContactChannel[] = ['email', 'phone', 'whatsapp', 'website', 'address', 'facebook', 'instagram', 'tiktok', 'twitter', 'telegram', 'linkedin', 'youtube', 'threads', 'pinterest'];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, FormActionsComponent, FormsModule, ListFilterPanelComponent, NumberStepperComponent, PageHeaderComponent, SwipeRowComponent],
  selector: 'app-contacts-page',
  templateUrl: './contacts-page.html',
  styleUrl: './contacts-page.scss',
})
export class ContactsPage implements OnInit {
  private readonly confirmation = inject(ConfirmDialogService);
  private readonly contactSheet = inject(ContactActionSheetService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ContactService);
  private readonly operationService = inject(OperationService);
  private readonly purchaseService = inject(PurchaseService);

  protected readonly roleOptions = ROLE_OPTIONS;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly roleIcons = ROLE_ICONS;
  protected readonly channelLabels = CONTACT_CHANNEL_LABELS;
  protected readonly channelOptions = CONTACT_METHOD_CHANNEL_OPTIONS;

  protected readonly contacts = signal<readonly Party[]>([]);
  protected readonly operations = signal<readonly Operation[]>([]);
  protected readonly purchases = signal<readonly Purchase[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly query = signal('');
  /** Vuoto = nessun filtro di ruolo (tutti i contatti); piu ruoli selezionati = OR tra loro (es. cliente + organizzatore). */
  protected readonly roleFilter = signal<readonly PartyRole[]>([]);
  protected readonly typeFilter = signal<'all' | 'person' | 'organization'>('all');
  protected readonly supplierTypeFilter = signal<'all' | SupplierType>('all');
  protected readonly purchasesMin = signal<number | null>(null);
  protected readonly purchasesMax = signal<number | null>(null);
  protected readonly spendingMin = signal<number | null>(null);
  protected readonly spendingMax = signal<number | null>(null);
  protected readonly filtersOpen = signal(false);
  protected readonly sortOpen = signal(false);
  protected readonly sortKey = signal<ContactSortKey>('name');
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
  protected readonly openRowId = signal<string | null>(null);

  protected draft: ContactInput = this.emptyDraft();
  protected draftContacts: PartyContactMethod[] = [];
  private presetRole: PartyRole | null = null;
  private returnOperationId: string | null = null;
  private returnPath = '/sales';

  ngOnInit(): void {
    const preset = this.route.snapshot.data['presetRole'] as PartyRole | undefined;
    if (preset) { this.presetRole = preset; this.roleFilter.set([preset]); }
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('create') !== 'quick') return;
      this.returnOperationId = params.get('returnOperationId');
      this.returnPath = params.get('returnPath') || '/sales';
      this.startCreating(params.get('name') || '');
    });
    void this.load();
  }

  protected async applyFilters(): Promise<void> { await this.load(); }

  protected visibleContacts(): readonly Party[] {
    const roles = this.roleFilter();
    const type = this.typeFilter();
    const supplierType = this.supplierTypeFilter();
    let list = this.contacts();
    if (roles.length) list = list.filter((party) => roles.some((role) => party.roles?.includes(role)));
    if (type !== 'all') list = list.filter((party) => party.type === type);
    if (supplierType !== 'all') list = list.filter((party) => party.supplierType === supplierType);
    if (this.purchasesMin() !== null) list = list.filter((party) => this.purchaseCount(party) >= this.purchasesMin()!);
    if (this.purchasesMax() !== null) list = list.filter((party) => this.purchaseCount(party) <= this.purchasesMax()!);
    if (this.spendingMin() !== null) list = list.filter((party) => this.purchaseTotal(party) >= this.spendingMin()!);
    if (this.spendingMax() !== null) list = list.filter((party) => this.purchaseTotal(party) <= this.spendingMax()!);
    return [...list].sort((first, second) => this.compareContacts(first, second));
  }

  protected hasActiveFilters(): boolean {
    return Boolean(this.query().trim()) || this.roleFilter().length > 0 || this.typeFilter() !== 'all' || this.supplierTypeFilter() !== 'all'
      || this.purchasesMin() !== null || this.purchasesMax() !== null || this.spendingMin() !== null || this.spendingMax() !== null;
  }

  protected isRoleFilterChecked(role: PartyRole): boolean { return this.roleFilter().includes(role); }
  protected toggleRoleFilter(role: PartyRole, checked: boolean): void {
    const current = this.roleFilter();
    this.roleFilter.set(checked ? [...current, role] : current.filter((item) => item !== role));
  }
  protected closeFilterPanel(): void { this.filtersOpen.set(false); }
  protected resetFilters(): void {
    this.query.set(''); this.roleFilter.set(this.presetRole ? [this.presetRole] : []); this.typeFilter.set('all'); this.supplierTypeFilter.set('all');
    this.purchasesMin.set(null); this.purchasesMax.set(null); this.spendingMin.set(null); this.spendingMax.set(null);
    this.filtersOpen.set(false); void this.load();
  }
  protected hasActiveSort(): boolean { return this.sortKey() !== 'name' || this.sortDirection() !== 'asc'; }
  protected toggleSort(): void { this.sortOpen.update((open) => !open); this.filtersOpen.set(false); }
  protected restoreSort(): void { this.sortKey.set('name'); this.sortDirection.set('asc'); this.sortOpen.set(false); }
  protected changeSortDirection(): void { this.sortDirection.update((direction) => direction === 'asc' ? 'desc' : 'asc'); }
  @HostListener('document:click', ['$event'])
  protected closeSortOutside(event: MouseEvent): void { const target = event.target; if (this.sortOpen() && (!(target instanceof Element) || (!target.closest('.sort-panel') && !target.closest('.sort-toggle')))) this.sortOpen.set(false); }

  private compareContacts(first: Party, second: Party): number {
    const value = (party: Party): string | number => {
      if (this.sortKey() === 'purchases') return this.purchaseCount(party);
      if (this.sortKey() === 'spending') return this.purchaseTotal(party);
      if (this.sortKey() === 'type') return party.supplierType ? SUPPLIER_TYPE_LABELS[party.supplierType] : party.type;
      return party.displayName.toLocaleLowerCase();
    };
    const firstValue = value(first); const secondValue = value(second);
    const result = typeof firstValue === 'number' && typeof secondValue === 'number' ? firstValue - secondValue : String(firstValue).localeCompare(String(secondValue), 'it', { numeric: true, sensitivity: 'base' });
    return this.sortDirection() === 'asc' ? result : -result;
  }

  protected contactRightActions(contact: Party): SwipeAction[] {
    const actions: SwipeAction[] = [{ key: 'edit', icon: '✎', label: 'Modifica', kind: 'auto', run: () => this.startEditing(contact) }];
    if (this.hasContactOptions(contact)) actions.push({ key: 'contact', icon: '📇', label: 'Contatta', run: () => this.openContactSheet(contact) });
    return actions;
  }

  protected contactLeftActions(contact: Party): SwipeAction[] {
    return [{ key: 'delete', icon: '🗑', label: 'Elimina', variant: 'danger', kind: 'auto', disabled: this.isContactUsed(contact), run: () => this.remove(contact) }];
  }

  protected hasContactOptions(contact: Party): boolean { return partyContactOptions(contact).length > 0; }
  protected openContactSheet(contact: Party): void { this.contactSheet.open(contact); }

  protected isContactUsed(contact: Party): boolean {
    return this.operations().some((operation) => operation.partyId === contact.id) || this.purchases().some((purchase) => purchase.supplierId === contact.id);
  }
  protected purchaseCount(contact: Party): number {
    return this.operations().filter((operation) => !operation.parentOperationId && operation.partyId === contact.id && (operation.type === 'sale' || operation.type === 'bundle')).length;
  }
  protected purchaseTotal(contact: Party): number {
    return this.operations().filter((operation) => !operation.parentOperationId && operation.partyId === contact.id && (operation.type === 'sale' || operation.type === 'bundle')).reduce((total, operation) => total + (operation.amount ?? 0), 0);
  }
  protected openContactSales(contact: Party): void { void this.router.navigate(['/sales'], { queryParams: { customer: contact.id } }); }
  protected supplierTypeLabel(type: SupplierType | undefined): string { return type ? SUPPLIER_TYPE_LABELS[type] : ''; }
  protected roleBadges(contact: Party): readonly string[] { return (contact.roles ?? []).map((role) => ROLE_LABELS[role]); }
  protected contactMethodSummary(contact: Party): string {
    const extra = (contact.contacts ?? []).map((method) => `${CONTACT_CHANNEL_LABELS[method.channel]}: ${method.value}`);
    return extra.join(' · ');
  }

  protected startCreating(displayName = ''): void {
    this.resetMessages();
    this.draft = { ...this.emptyDraft(), displayName, roles: this.presetRole ? [this.presetRole] : [] };
    this.draftContacts = [];
    this.editingId.set(null);
    this.creating.set(true);
  }

  protected startEditing(contact: Party): void {
    this.resetMessages();
    this.draft = {
      type: contact.type,
      displayName: contact.displayName,
      roles: [...(contact.roles ?? [])],
      supplierType: contact.supplierType,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      contacts: contact.contacts,
      preferredContactChannel: contact.preferredContactChannel,
      preferredContactMethodId: contact.preferredContactMethodId,
      notes: contact.notes ?? '',
    };
    this.draftContacts = (contact.contacts ?? []).map((method) => ({ ...method }));
    this.editingId.set(contact.id);
    this.creating.set(false);
  }

  protected cancelForm(): void { this.creating.set(false); this.editingId.set(null); }

  protected hasRole(role: PartyRole): boolean { return this.draft.roles?.includes(role) ?? false; }
  /** Un contatto gia' collegato a vendite/lavorazioni non puo' perdere il ruolo Cliente (storico operazioni). */
  protected isCustomerRoleLocked(): boolean {
    const id = this.editingId();
    return Boolean(id) && this.operations().some((operation) => operation.partyId === id);
  }
  protected toggleRole(role: PartyRole, checked: boolean): void {
    if (role === 'customer' && !checked && this.isCustomerRoleLocked()) return;
    const current = this.draft.roles ?? [];
    this.draft = { ...this.draft, roles: checked ? [...current, role] : current.filter((item) => item !== role) };
  }

  protected addContactMethod(): void {
    this.draftContacts = [...this.draftContacts, { id: crypto.randomUUID(), channel: 'phone', value: '' }];
  }
  protected removeContactMethod(id: string): void {
    this.draftContacts = this.draftContacts.filter((method) => method.id !== id);
    if (this.draft.preferredContactMethodId === id) this.draft = { ...this.draft, preferredContactChannel: undefined, preferredContactMethodId: undefined };
  }
  protected updateContactMethod(id: string, patch: Partial<PartyContactMethod>): void {
    this.draftContacts = this.draftContacts.map((method) => method.id === id ? { ...method, ...patch } : method);
  }

  /** Opzioni di contatto calcolate sulla bozza non ancora salvata, cosi' il recapito preferito si puo' scegliere subito durante la compilazione. */
  protected draftContactOptions(): PartyContactOption[] { return partyContactOptions(this.draftAsParty()); }
  protected draftPreferredKey(): string { return this.draft.preferredContactChannel ? `${this.draft.preferredContactChannel}:${this.draft.preferredContactMethodId ?? ''}` : ''; }
  protected setPreferredOption(key: string): void {
    if (!key) { this.draft = { ...this.draft, preferredContactChannel: undefined, preferredContactMethodId: undefined }; return; }
    const option = this.draftContactOptions().find((item) => `${item.channel}:${item.methodId ?? ''}` === key);
    this.draft = { ...this.draft, preferredContactChannel: option?.channel, preferredContactMethodId: option?.methodId };
  }
  private draftAsParty(): Party {
    return { id: '', createdAt: '', updatedAt: '', ...this.draft, contacts: this.draftContacts } as Party;
  }

  protected async save(): Promise<void> {
    this.saving.set(true); this.resetMessages();
    try {
      const input: ContactInput = { ...this.draft, contacts: this.draftContacts.filter((method) => method.value.trim()) };
      const contact = this.editingId() ? await this.service.update(this.editingId()!, input) : await this.service.create(input);
      if (this.returnOperationId) {
        await this.assignContactToOperationTree(this.returnOperationId, contact.id, contact.displayName);
        await this.router.navigate([this.returnPath], { queryParams: { open: this.returnOperationId } });
        return;
      }
      this.cancelForm();
      this.successMessage.set('Contatto salvato localmente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il contatto.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(contact: Party): Promise<void> {
    if (!(await this.confirmation.confirm(`Eliminare logicamente "${contact.displayName}"?`))) return;
    this.resetMessages();
    try {
      await this.service.delete(contact.id);
      this.successMessage.set('Contatto eliminato logicamente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare il contatto.');
    }
  }

  private async assignContactToOperationTree(operationId: string, partyId: string, customerName: string): Promise<void> {
    const operations = await this.operationService.list('all');
    const targetIds = new Set([operationId, ...operations.filter((operation) => operation.parentOperationId === operationId).map((operation) => operation.id)]);
    for (const operation of operations.filter((item) => targetIds.has(item.id))) {
      await this.operationService.update(operation.id, {
        type: operation.type,
        title: operation.title,
        description: operation.description,
        partyId,
        fairEditionId: operation.fairEditionId,
        productId: operation.productId,
        serviceId: operation.serviceId,
        bundleId: operation.bundleId,
        parentOperationId: operation.parentOperationId,
        lotId: operation.lotId,
        customerName,
        amount: operation.amount,
        quantity: operation.quantity,
        notes: operation.notes,
        workStatus: operation.workStatus,
        deliveryDate: operation.deliveryDate,
        needsReview: operation.needsReview,
      });
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [contacts, operations, purchases] = await Promise.all([
        this.service.list({ text: this.query() || undefined }),
        this.operationService.list('all'),
        this.purchaseService.list(),
      ]);
      this.contacts.set(contacts);
      this.operations.set(operations);
      this.purchases.set(purchases);
    } catch {
      this.errorMessage.set('Impossibile caricare i contatti.');
    } finally {
      this.loading.set(false);
    }
  }

  private resetMessages(): void { this.errorMessage.set(''); this.successMessage.set(''); }

  private emptyDraft(): ContactInput {
    return { type: 'person', displayName: '', roles: [], supplierType: undefined, email: '', phone: '', contacts: [], notes: '' };
  }
}
