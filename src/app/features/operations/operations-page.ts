import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OperationService, type OperationInput } from '../../application/operations/operation.service';
import { PaymentMethodService } from '../../application/payment-methods/payment-method.service';
import { PaymentService } from '../../application/payments/payment.service';
import { ClientService } from '../../application/clients/client.service';
import { FairService } from '../../application/fairs/fair.service';
import { LotService } from '../../application/lots/lot.service';
import { ProductService } from '../../application/products/product.service';
import { ServiceService } from '../../application/services/service.service';
import { BundleService } from '../../application/bundles/bundle.service';
import { distributeAmountsToCents } from '../../domain/shared/money';
import type { Lot } from '../../domain/models/lot';
import type { Operation, OperationType } from '../../domain/models/operation';
import type { Bundle } from '../../domain/models/bundle';
import type { PaymentMethod } from '../../domain/models/payment-method';
import type { Payment } from '../../domain/models/payment';
import type { Party } from '../../domain/models/party';
import type { Product } from '../../domain/models/product';
import type { Service } from '../../domain/models/service';
import type { Fair } from '../../domain/models/fair';
import { isBundleAvailable } from '../../domain/shared/catalog-availability';
import { FormActionsComponent } from '../../shared/components/form-actions.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { ActiveFairService } from '../../core/event/active-fair.service';

interface PaymentDraft {
  amount?: number;
  paymentDate: string;
  paymentMethodId: string;
}

interface BundleDetailDraft {
  id: string;
  title: string;
  productId?: string;
  serviceId?: string;
  lotId?: string;
  quantity: number;
  amount: number;
}

interface OfferChoice {
  readonly key: string;
  readonly label: string;
  readonly available: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormActionsComponent, FormsModule, PageHeaderComponent],
  selector: 'app-operations-page',
  templateUrl: './operations-page.html',
  styleUrl: './operations-page.scss',
})
export class OperationsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly activeFairMode = inject(ActiveFairService);
  private readonly service = inject(OperationService);
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly paymentService = inject(PaymentService);
  private readonly clientService = inject(ClientService);
  private readonly fairService = inject(FairService);
  private readonly lotService = inject(LotService);
  private readonly productService = inject(ProductService);
  private readonly serviceService = inject(ServiceService);
  private readonly bundleService = inject(BundleService);

  protected readonly operations = signal<readonly Operation[]>([]);
  private allOperations: readonly Operation[] = [];
  protected readonly salesOnly = this.route.snapshot.data['salesOnly'] === true;
  protected readonly worksOnly = this.route.snapshot.data['worksOnly'] === true;
  protected readonly paymentMethods = signal<readonly PaymentMethod[]>([]);
  protected readonly payments = signal<readonly Payment[]>([]);
  protected readonly parties = signal<readonly Party[]>([]);
  protected readonly fairs = signal<readonly Fair[]>([]);
  protected readonly lots = signal<readonly Lot[]>([]);
  protected readonly products = signal<readonly Product[]>([]);
  protected readonly services = signal<readonly Service[]>([]);
  protected readonly bundles = signal<readonly Bundle[]>([]);
  protected readonly bundleDetails = signal<BundleDetailDraft[]>([]);
  protected readonly bundleParentMode = signal(false);
  protected readonly offerSelection = signal('');
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly mode = signal<'fair' | 'backoffice'>('backoffice');
  protected readonly query = signal('');
  protected readonly typeFilter = signal<OperationType | 'all'>('all');
  protected readonly yearFilter = signal<number | null>(null);
  protected readonly workFilter = signal<'open' | 'requested' | 'in-progress' | 'to-deliver' | 'unpaid' | null>(null);
  protected readonly fairScopeFilter = signal<'fair' | 'non-fair' | null>(null);
  protected readonly offerFilter = signal('');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly filtersOpen = signal(false);
  protected draft: OperationInput = this.emptyDraft();
  protected paymentDraft: PaymentDraft = this.emptyPaymentDraft();
  private fairPaymentManuallyEdited = false;
  protected readonly customerMode = signal<'none' | 'soft' | 'existing'>('none');
  private pendingCreateTrigger: string | null = null;
  private pendingOpenId: string | null = null;
  private returnToDashboardAfterSave = false;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const year = Number(params.get('year'));
      this.yearFilter.set(Number.isInteger(year) && year > 0 ? year : null);
      const workFilter = params.get('workFilter');
      this.workFilter.set(workFilter === 'open' || workFilter === 'requested' || workFilter === 'in-progress' || workFilter === 'to-deliver' || workFilter === 'unpaid' ? workFilter : null);
      const fairScope = params.get('fairScope');
      this.fairScopeFilter.set(fairScope === 'fair' || fairScope === 'non-fair' ? fairScope : null);
      this.offerFilter.set(params.get('offer') ?? '');
    });
    this.route.queryParamMap.subscribe((params) => {
      const trigger = params.get('create');
      if (!trigger || trigger === this.pendingCreateTrigger) return;
      this.pendingCreateTrigger = trigger;
      if (!this.loading()) this.openTriggeredOperation();
    });
    this.route.queryParamMap.subscribe((params) => {
      const openId = params.get('open');
      if (!openId || openId === this.pendingOpenId) return;
      this.pendingOpenId = openId;
      if (!this.loading()) this.openRequestedWork();
    });
    void this.loadAll().then(() => { if (this.pendingCreateTrigger) this.openTriggeredOperation(); if (this.pendingOpenId) this.openRequestedWork(); });
  }

  protected async applyFilters(): Promise<void> { await this.loadOperations(); }
  protected hasActiveFilters(): boolean {
    return Boolean(this.query().trim()) || this.yearFilter() !== null || this.typeFilter() !== 'all' || Boolean(this.workFilter()) || Boolean(this.fairScopeFilter()) || Boolean(this.offerFilter());
  }
  protected availableYears(): readonly number[] {
    return [...new Set([new Date().getFullYear(), ...this.allOperations.map((operation) => Number((operation.operationDate ?? operation.createdAt).slice(0, 4)))])]
      .filter((year) => Number.isInteger(year) && year > 0)
      .sort((first, second) => second - first);
  }
  protected yearFilterOptions(): readonly { readonly value: string; readonly label: string }[] {
    return [{ value: '', label: 'Tutti' }, ...this.availableYears().map((year) => ({ value: String(year), label: String(year) }))];
  }
  protected changeYearFilter(value: string): void { this.changeYear(value ? Number(value) : null); }
  protected changeYear(year: number | null): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { year }, queryParamsHandling: 'merge' });
  }
  protected availableOfferFilterChoices(): readonly OfferChoice[] {
    return this.offerFilterChoices().filter((offer) => offer.available);
  }
  protected unavailableOfferFilterChoices(): readonly OfferChoice[] {
    return this.offerFilterChoices().filter((offer) => !offer.available);
  }
  private offerFilterChoices(): readonly OfferChoice[] {
    return [
      ...this.products().map((product) => ({ key: `product:${product.id}`, label: `Prodotto · ${product.name}`, available: product.active })),
      ...this.services().map((service) => ({ key: `service:${service.id}`, label: `Servizio · ${service.description}`, available: service.active })),
      ...this.bundles().map((bundle) => ({ key: `bundle:${bundle.id}`, label: `Bundle · ${bundle.name}`, available: isBundleAvailable(bundle, this.products(), this.services()) })),
    ].sort((first, second) => first.label.localeCompare(second.label));
  }
  protected changeOfferFilter(offer: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { offer: offer || null }, queryParamsHandling: 'merge' });
  }
  protected changeWorkFilter(filter: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { workFilter: filter || null }, queryParamsHandling: 'merge' });
  }
  protected changeFairScopeFilter(scope: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { fairScope: scope || null }, queryParamsHandling: 'merge' });
  }
  protected typeLabel(type: OperationType): string { return type === 'sale' ? 'Vendita' : type === 'bundle' ? 'Pacchetto' : 'Lavorazione'; }
  protected customerLabel(operation: Operation): string { return operation.partyId ? this.partyName(operation.partyId) : (operation.customerName || 'Cliente non indicato'); }
  protected partyName(id?: string): string { return this.parties().find((party) => party.id === id)?.displayName ?? 'Cliente non trovato'; }
  protected fairName(id?: string): string { const fair = this.fairs().find((item) => item.id === id); return fair ? `${fair.name} · ${fair.edition || fair.year}` : 'Fiera non indicata'; }
  protected formatDate(value?: string): string { return value ? new Intl.DateTimeFormat('it-IT').format(new Date(`${value}T00:00:00`)) : 'Non indicata'; }
  protected formatDateTime(value?: string): string { return value ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Non indicata'; }
  protected productName(id?: string): string { return this.products().find((product) => product.id === id)?.name ?? 'Prodotto non indicato'; }
  protected serviceName(id?: string): string { return this.services().find((service) => service.id === id)?.description ?? 'Servizio non indicato'; }
  protected bundleName(id?: string): string { return this.bundles().find((bundle) => bundle.id === id)?.name ?? 'Pacchetto non indicato'; }
  protected offerName(operation: Operation): string { return operation.bundleId ? this.bundleName(operation.bundleId) : operation.serviceId ? this.serviceName(operation.serviceId) : this.productName(operation.productId); }
  protected paymentMethodName(id?: string): string { return this.paymentMethods().find((paymentMethod) => paymentMethod.id === id)?.name ?? 'Non indicata'; }
  protected operationPayments(operationId: string | null): readonly Payment[] { return operationId ? this.payments().filter((payment) => payment.operationId === operationId) : []; }
  protected paymentTotal(operationId: string | null): number { return this.operationPayments(operationId).reduce((total, payment) => total + payment.amount, 0); }
  protected remainingPaymentAmount(): number { return Math.max((this.draft.amount ?? 0) - this.paymentTotal(this.editingId()), 0); }
  /** Le righe derivate da un pacchetto non hanno pagamenti propri: il pagato viene ripartito da quello registrato sul pacchetto padre. */
  protected paymentTotalFor(operation: Operation): number {
    if (!operation.parentOperationId) return this.paymentTotal(operation.id);
    const parent = this.allOperations.find((item) => item.id === operation.parentOperationId);
    if (!parent) return this.paymentTotal(operation.id);
    const parentAmount = parent.amount ?? 0;
    if (parentAmount <= 0) return 0;
    const parentPaid = this.paymentTotal(parent.id);
    return Math.min(operation.amount ?? 0, parentPaid * (operation.amount ?? 0) / parentAmount);
  }
  protected isEditingFullyPaid(): boolean { return Boolean(this.editingId()) && (this.draft.amount ?? 0) > 0 && this.paymentTotal(this.editingId()) >= (this.draft.amount ?? 0); }
  protected workStatusLabel(status?: Operation['workStatus']): string {
    return ({ requested: 'Richiesta', 'in-progress': 'In corso', completed: 'Terminata', delivered: 'Consegnata/Spedita', cancelled: 'Cancellata' } as Record<string, string>)[status ?? ''] ?? 'Non indicata';
  }
  protected workStatusIcon(status?: Operation['workStatus']): string {
    return ({ requested: '📝', 'in-progress': '🛠️', completed: '✅', delivered: '📦', cancelled: '🚫' } as Record<string, string>)[status ?? ''] ?? '❔';
  }
  protected lotName(id?: string): string { return this.lots().find((lot) => lot.id === id)?.name ?? 'Collegamento non assegnato'; }
  protected hasWork(operation: Operation): boolean { return Boolean(operation.workStatus); }
  protected hasSale(operation: Operation): boolean { return operation.type === 'sale' || typeof operation.amount === 'number'; }
  protected activeFair(): Fair | null { return this.activeFairMode.activeFair(); }
  protected availableOfferChoices(): readonly OfferChoice[] {
    return this.offerChoices().filter((offer) => offer.available);
  }

  protected unavailableOfferChoices(): readonly OfferChoice[] {
    return this.offerChoices().filter((offer) => !offer.available);
  }

  private offerChoices(): readonly OfferChoice[] {
    const concludedFairIds = this.fairs()
      .filter((fair) => fair.endDate < new Date().toISOString().slice(0, 10))
      .sort((first, second) => second.endDate.localeCompare(first.endDate))
      .slice(0, 10)
      .map((fair) => fair.id);
    const usage = new Map<string, number>();
    for (const operation of this.operations()) {
      if (!operation.fairEditionId || !concludedFairIds.includes(operation.fairEditionId)) continue;
      const key = operation.serviceId ? `service:${operation.serviceId}` : operation.productId ? `product:${operation.productId}` : undefined;
      if (key) usage.set(key, (usage.get(key) ?? 0) + 1);
    }
    return [
      ...(!this.worksOnly ? this.products().map((product) => ({ key: `product:${product.id}`, label: product.name, available: product.active })) : []),
      ...this.services().map((service) => ({ key: `service:${service.id}`, label: service.description, available: service.active })),
      ...(!this.worksOnly ? this.bundles().map((bundle) => ({ key: `bundle:${bundle.id}`, label: bundle.name, available: isBundleAvailable(bundle, this.products(), this.services()) })) : []),
    ].sort((first, second) => (usage.get(second.key) ?? 0) - (usage.get(first.key) ?? 0) || first.label.localeCompare(second.label));
  }

  protected openFairWizard(): void { this.mode.set('fair'); this.startCreating('sale'); }
  protected openWork(operation: Operation): void { void this.router.navigate(['/works'], { queryParams: { open: operation.id } }); }
  protected visibleOperations(): readonly Operation[] {
    let operations = this.salesOnly ? this.operations().filter((operation) => !operation.parentOperationId) : [...this.operations()];
    const year = this.yearFilter();
    if (year) operations = operations.filter((operation) => Number((operation.operationDate ?? operation.createdAt).slice(0, 4)) === year);
    if (this.salesOnly && this.fairScopeFilter()) operations = operations.filter((operation) => this.fairScopeFilter() === 'fair' ? Boolean(operation.fairEditionId) : !operation.fairEditionId);
    if (this.salesOnly && this.offerFilter()) {
      const [kind, id] = this.offerFilter().split(':');
      operations = operations.filter((operation) => kind === 'product' ? operation.productId === id : kind === 'service' ? operation.serviceId === id : kind === 'bundle' ? operation.bundleId === id : true);
    }
    if (this.worksOnly) {
      const filter = this.workFilter();
      if (filter === 'open') operations = operations.filter((operation) => operation.workStatus !== 'delivered' && operation.workStatus !== 'cancelled');
      if (filter === 'requested') operations = operations.filter((operation) => operation.workStatus === 'requested');
      if (filter === 'in-progress') operations = operations.filter((operation) => operation.workStatus === 'in-progress');
      if (filter === 'to-deliver') operations = operations.filter((operation) => operation.workStatus === 'completed');
      if (filter === 'unpaid') operations = operations.filter((operation) => this.paymentTotalFor(operation) + 0.005 < (operation.amount ?? 0));
    }
    return operations;
  }
  protected bundleDetailTotal(): number { return this.bundleDetails().reduce((total, detail) => total + detail.amount, 0); }
  protected updateBundleDetailAmount(id: string, amount: number | null): void {
    const total = this.draft.amount ?? 0;
    const nextAmount = Math.round(Math.max(0, amount ?? 0) * 100) / 100;
    this.bundleDetails.update((details) => {
      const updated = details.map((detail) => detail.id === id ? { ...detail, amount: nextAmount } : { ...detail });
      const others = updated.filter((detail) => detail.id !== id);
      const remaining = total - nextAmount;
      if (remaining < 0 || !others.length) return updated;
      const othersTotal = others.reduce((sum, detail) => sum + detail.amount, 0);
      const rawAmounts = others.map((detail) => othersTotal > 0 ? remaining * detail.amount / othersTotal : remaining / others.length);
      const roundedAmounts = distributeAmountsToCents(rawAmounts, remaining);
      let otherIndex = 0;
      return updated.map((detail) => {
        if (detail.id === id) return detail;
        const value = roundedAmounts[otherIndex]; otherIndex += 1;
        return { ...detail, amount: Math.max(0, value) };
      });
    });
  }
  protected startNewOperation(): void {
    this.returnToDashboardAfterSave = false;
    if (this.salesOnly && (window.innerWidth < 700 || this.activeFair())) {
      this.openFairWizard();
      return;
    }
    this.mode.set('backoffice');
    this.startCreating(this.salesOnly ? 'sale' : 'work');
  }
  protected selectingFairProduct(): boolean { return this.mode() === 'fair' && this.creating() && !this.draft.productId && !this.draft.serviceId && !this.draft.bundleId; }
  protected selectOffer(key: string): void {
    if (this.mode() === 'fair' && !this.availableOfferChoices().some((offer) => offer.key === key)) {
      this.errorMessage.set('Questo elemento non e disponibile per l\'inserimento rapido.');
      return;
    }
    if (!this.creating()) this.startCreating('sale');
    this.offerSelection.set(key);
    const [kind, id] = key.split(':');
    if (kind === 'bundle') {
      const bundle = this.bundles().find((item) => item.id === id);
      this.bundleParentMode.set(true);
      this.draft = { ...this.draft, productId: undefined, serviceId: undefined, bundleId: id, lotId: undefined, title: bundle?.name ?? '', amount: bundle?.bundlePrice, workStatus: undefined };
      if (this.mode() === 'fair') this.paymentDraft = { ...this.paymentDraft, amount: bundle?.bundlePrice, paymentMethodId: this.defaultPaymentMethodId() };
      this.bundleDetails.set([]);
      return;
    }
    if (kind === 'service') {
      const service = this.services().find((item) => item.id === id);
      this.bundleParentMode.set(false);
      this.draft = { ...this.draft, productId: undefined, serviceId: id, bundleId: undefined, lotId: undefined, title: service?.description ?? '', workStatus: 'requested', deliveryDate: this.draft.deliveryDate ?? this.today() };
      if (this.mode() === 'fair') this.paymentDraft = { ...this.paymentDraft, paymentMethodId: this.defaultPaymentMethodId() };
      return;
    }
    const product = this.products().find((item) => item.id === id);
    this.bundleParentMode.set(false);
    this.draft = { ...this.draft, productId: id, serviceId: undefined, bundleId: undefined, title: product?.name ?? '', amount: product?.suggestedPrice, workStatus: this.worksOnly ? (this.draft.workStatus ?? 'requested') : undefined, deliveryDate: this.worksOnly ? (this.draft.deliveryDate ?? this.today()) : undefined };
    if (this.mode() === 'fair') this.paymentDraft = { ...this.paymentDraft, amount: product?.suggestedPrice, paymentMethodId: this.defaultPaymentMethodId() };
  }
  protected changeOffer(key: string): void { this.selectOffer(key); }
  protected clearSelectedProduct(): void { this.offerSelection.set(''); this.draft = { ...this.draft, productId: undefined, serviceId: undefined, bundleId: undefined, title: '', amount: undefined, workStatus: undefined }; }
  protected updateFairAmount(amount: number | null): void {
    this.draft = { ...this.draft, amount: amount ?? undefined };
    if (!this.fairPaymentManuallyEdited) this.paymentDraft = { ...this.paymentDraft, amount: amount ?? undefined, paymentMethodId: this.defaultPaymentMethodId() };
  }
  protected updateFairPaymentAmount(amount: number | null): void { this.fairPaymentManuallyEdited = true; this.paymentDraft = { ...this.paymentDraft, amount: amount ?? undefined }; }
  protected updateCustomerName(value: string): void {
    this.draft = { ...this.draft, customerName: value, partyId: undefined };
    this.customerMode.set(value.trim() ? 'soft' : 'none');
  }
  protected customerSuggestions(): readonly Party[] {
    const normalized = this.draft.customerName?.trim().toLowerCase() ?? '';
    if (normalized.length < 2 || this.customerMode() === 'existing') return [];
    return this.parties()
      .filter((party) => party.displayName.toLowerCase().includes(normalized))
      .slice(0, 3);
  }
  protected selectCustomerSuggestion(party: Party): void {
    this.draft = { ...this.draft, partyId: party.id, customerName: party.displayName };
    this.customerMode.set('existing');
  }
  protected continueWithSoftCustomer(): void {
    this.draft = { ...this.draft, partyId: undefined };
    this.customerMode.set(this.draft.customerName?.trim() ? 'soft' : 'none');
  }
  protected canRegisterQuickCustomer(): boolean { return !this.draft.partyId && Boolean(this.draft.customerName?.trim()); }
  protected registerQuickCustomer(): void {
    if (!this.editingId() || !this.canRegisterQuickCustomer()) return;
    void this.router.navigate(['/clients'], { queryParams: { create: 'quick', name: this.draft.customerName, returnOperationId: this.editingId(), returnPath: this.salesOnly ? '/sales' : '/operations' } });
  }
  protected startCreating(type: OperationType = 'sale'): void {
    this.resetMessages();
    this.customerMode.set('none');
    this.draft = this.emptyDraft(this.salesOnly ? 'sale' : this.worksOnly ? 'work' : type);
    this.paymentDraft = this.emptyPaymentDraft();
    this.bundleDetails.set([]);
    this.bundleParentMode.set(false);
    this.fairPaymentManuallyEdited = false;
    this.offerSelection.set('');
    this.editingId.set(null);
    this.creating.set(true);
  }
  protected startEditing(operation: Operation): void {
    this.resetMessages();
    this.customerMode.set(operation.partyId ? 'existing' : (operation.customerName ? 'soft' : 'none'));
    this.draft = { ...this.emptyDraft(this.salesOnly ? 'sale' : operation.type), ...operation, operationDate: this.dateTimeInputValue(operation.operationDate ?? operation.createdAt), type: this.salesOnly ? 'sale' : operation.type };
    this.paymentDraft = this.emptyPaymentDraft();
    this.fairPaymentManuallyEdited = false;
    this.offerSelection.set(operation.serviceId ? `service:${operation.serviceId}` : operation.productId ? `product:${operation.productId}` : '');
    this.bundleParentMode.set(operation.type === 'bundle');
    if (operation.type === 'bundle') {
      this.offerSelection.set(`bundle:${operation.bundleId}`);
      this.bundleDetails.set(this.operations().filter((item) => item.parentOperationId === operation.id).map((item) => ({ id: item.id, title: item.title, productId: item.productId, serviceId: item.serviceId, lotId: item.lotId, quantity: item.quantity ?? 1, amount: item.amount ?? 0 })));
      const remaining = Math.max((operation.amount ?? 0) - this.paymentTotal(operation.id), 0);
      if (remaining > 0) this.paymentDraft = { amount: remaining, paymentDate: this.today(), paymentMethodId: this.defaultPaymentMethodId() };
    } else {
      this.bundleDetails.set([]);
    }
    this.editingId.set(operation.id);
    this.creating.set(false);
    this.mode.set('backoffice');
  }
  protected isBundleChild(): boolean { return Boolean(this.draft.parentOperationId); }
  protected cancelForm(): void { this.creating.set(false); this.editingId.set(null); this.returnToDashboardAfterSave = false; }

  protected async save(): Promise<void> {
    this.saving.set(true); this.resetMessages();
    const input = this.prepareInput();
    try {
      const fairPaymentAmount = this.paymentDraft.amount ?? 0;
      const paymentAmount = this.mode() === 'fair' ? fairPaymentAmount : (this.paymentDraft.amount ?? 0);
      if (paymentAmount > 0) this.ensurePaymentDoesNotExceedTotal(input.amount ?? 0, this.paymentTotal(this.editingId()), paymentAmount);
      const operation = (input.bundleId && this.bundleParentMode()) ? await this.saveBundleSale(input) : this.editingId() ? await this.service.update(this.editingId()!, input) : await this.service.create(input);
      if (this.mode() === 'fair' && (input.amount ?? 0) > 0 && fairPaymentAmount > 0) {
        await this.paymentService.create({ operationId: operation.id, amount: fairPaymentAmount, paymentDate: this.paymentDraft.paymentDate, paymentMethodId: this.paymentDraft.paymentMethodId || this.defaultPaymentMethodId() });
      } else if (this.mode() !== 'fair' && this.hasPaymentDraft()) {
        await this.paymentService.create({ operationId: operation.id, amount: this.paymentDraft.amount!, paymentDate: this.paymentDraft.paymentDate, paymentMethodId: this.paymentDraft.paymentMethodId });
      }
      this.payments.set(await this.paymentService.list());
      const returnToDashboard = this.returnToDashboardAfterSave;
      this.cancelForm(); this.successMessage.set('Operazione salvata localmente.'); await this.loadOperations();
      if (returnToDashboard) await this.router.navigate(['/dashboard']);
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare l\'operazione.'); }
    finally { this.saving.set(false); }
  }

  protected async remove(operation: Operation): Promise<void> {
    if (!window.confirm(`Eliminare logicamente "${operation.title}"?`)) return;
    this.resetMessages();
    try {
      await this.service.delete(operation.id);
      if (operation.type === 'bundle') for (const detail of this.operations().filter((item) => item.parentOperationId === operation.id)) await this.service.delete(detail.id);
      this.successMessage.set('Operazione eliminata logicamente.'); await this.loadOperations();
    }
    catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare l\'operazione.'); }
  }

  protected async addPayment(): Promise<void> {
    if (!this.editingId() || !this.hasPaymentDraft()) return;
    this.saving.set(true); this.resetMessages();
    try {
      this.ensurePaymentDoesNotExceedTotal(this.draft.amount ?? 0, this.paymentTotal(this.editingId()), this.paymentDraft.amount ?? 0);
      await this.paymentService.create({ operationId: this.editingId()!, amount: this.paymentDraft.amount!, paymentDate: this.paymentDraft.paymentDate, paymentMethodId: this.paymentDraft.paymentMethodId });
      this.paymentDraft = this.emptyPaymentDraft();
      this.payments.set(await this.paymentService.list());
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile aggiungere il pagamento.'); }
    finally { this.saving.set(false); }
  }

  protected async removePayment(payment: Payment): Promise<void> {
    if (!window.confirm(`Eliminare il pagamento di ${payment.amount.toFixed(2)} €?`)) return;
    await this.paymentService.delete(payment.id);
    this.payments.set(await this.paymentService.list());
  }

  private async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const [operations, parties, fairs, lots, paymentMethods, payments, products, services, bundles] = await Promise.all([this.service.list(this.salesOnly ? 'sale' : 'all'), this.clientService.list(), this.fairService.list(), this.lotService.list(), this.paymentMethodService.list(), this.paymentService.list(), this.productService.list(), this.serviceService.list(), this.bundleService.list()]);
      this.activeFairMode.setFairs(fairs);
      this.allOperations = operations; this.operations.set(this.filterOperations(operations)); this.parties.set(parties); this.fairs.set(fairs); this.lots.set(lots); this.paymentMethods.set(paymentMethods); this.payments.set(payments); this.products.set(products); this.services.set(services); this.bundles.set(bundles);
    } catch { this.errorMessage.set('Impossibile caricare le operazioni.'); }
    finally { this.loading.set(false); }
  }

  private async loadOperations(): Promise<void> { this.loading.set(true); try { const operations = await this.service.list(this.salesOnly ? 'sale' : 'all', this.query()); this.allOperations = operations; this.operations.set(this.filterOperations(operations)); } finally { this.loading.set(false); } }
  private resetMessages(): void { this.errorMessage.set(''); this.successMessage.set(''); }
  private openTriggeredOperation(): void {
    this.returnToDashboardAfterSave = Boolean(this.activeFair());
    this.openFairWizard();
  }
  private openRequestedWork(): void {
    const operation = this.operations().find((item) => item.id === this.pendingOpenId);
    if (operation) this.startEditing(operation);
  }
  private prepareInput(): OperationInput {
    const product = this.products().find((item) => item.id === this.draft.productId);
    const service = this.services().find((item) => item.id === this.draft.serviceId);
    const title = this.draft.title.trim() || product?.name || service?.description || this.draft.description?.trim() || 'Operazione fiera';
    const fairEditionId = this.mode() === 'fair' ? (this.activeFair()?.id ?? this.draft.fairEditionId) : this.draft.fairEditionId;
    const partyId = this.customerMode() === 'existing' ? this.draft.partyId : undefined;
    const customerName = this.customerMode() === 'soft' ? this.draft.customerName?.trim() : undefined;
    const type = this.salesOnly ? 'sale' : (this.draft.type || 'work');
    const lotId = this.draft.serviceId ? undefined : (this.draft.lotId ?? this.autoDetectLotId());
    return { ...this.draft, title, fairEditionId, partyId, customerName, lotId, type, quantity: this.draft.quantity ?? 1, operationDate: this.toIsoDateTime(this.draft.operationDate), workStatus: this.draft.serviceId ? (this.draft.workStatus ?? 'requested') : this.draft.workStatus, needsReview: this.draft.needsReview ?? false };
  }

  private async saveBundleSale(input: OperationInput): Promise<Operation> {
    const bundle = this.bundles().find((item) => item.id === input.bundleId);
    if (!bundle) throw new Error('Pacchetto non trovato.');
    const parentInput: OperationInput = { ...input, type: 'bundle', title: bundle.name, productId: undefined, serviceId: undefined, lotId: undefined, amount: input.amount ?? bundle.bundlePrice, quantity: input.quantity ?? 1 };
    if (this.editingId() && this.bundleDetails().length && Math.abs(this.bundleDetailTotal() - (parentInput.amount ?? 0)) > 0.01) throw new Error('La somma dei dettagli deve coincidere con il prezzo del pacchetto.');
    const parent = this.editingId() ? await this.service.update(this.editingId()!, parentInput) : await this.service.create(parentInput);
    if (this.editingId()) {
      for (const detail of this.bundleDetails()) {
        await this.service.update(detail.id, { type: detail.serviceId ? 'work' : 'sale', title: detail.title, productId: detail.productId, serviceId: detail.serviceId, bundleId: bundle.id, parentOperationId: parent.id, lotId: detail.lotId, quantity: detail.quantity, amount: detail.amount, operationDate: parent.operationDate, partyId: parent.partyId, customerName: parent.customerName, fairEditionId: parent.fairEditionId, description: parent.description, notes: parent.notes, workStatus: detail.serviceId ? 'requested' : undefined, deliveryDate: parent.deliveryDate, needsReview: parent.needsReview });
      }
      return parent;
    }
    const productLookup = new Map(this.products().map((product) => [product.id, product]));
    const serviceLookup = new Map(this.services().map((service) => [service.id, service]));
    const resolved = this.bundleService.resolveItemAmounts(bundle, productLookup, serviceLookup);
    const resolvedTotal = resolved.reduce((total, item) => total + item.amount, 0);
    const factor = resolvedTotal > 0 ? (parent.amount ?? resolvedTotal) / resolvedTotal : 0;
    const scaledAmounts = distributeAmountsToCents(resolved.map((detail) => detail.amount * factor), parent.amount ?? resolvedTotal);
    for (const [index, detail] of resolved.entries()) {
      await this.service.create({ type: detail.catalogKind === 'service' ? 'work' : 'sale', title: detail.name, productId: detail.catalogKind === 'product' ? detail.catalogId : undefined, serviceId: detail.catalogKind === 'service' ? detail.catalogId : undefined, bundleId: bundle.id, parentOperationId: parent.id, lotId: detail.catalogKind === 'product' ? this.defaultLotForProduct(detail.catalogId) : undefined, quantity: detail.quantity * (parent.quantity ?? 1), amount: scaledAmounts[index], operationDate: parent.operationDate, partyId: parent.partyId, customerName: parent.customerName, fairEditionId: parent.fairEditionId, description: parent.description, notes: parent.notes, workStatus: detail.catalogKind === 'service' ? 'requested' : undefined, deliveryDate: parent.deliveryDate, needsReview: parent.needsReview });
    }
    return parent;
  }
  private emptyDraft(type: OperationType = 'work'): OperationInput {
    return { type, title: '', description: '', partyId: undefined, fairEditionId: type === 'sale' ? this.activeFair()?.id : undefined, productId: undefined, serviceId: undefined, bundleId: undefined, parentOperationId: undefined, lotId: undefined, customerName: '', amount: undefined, quantity: 1, operationDate: this.dateTimeInputValue(new Date().toISOString()), notes: '', workStatus: type === 'work' ? 'requested' : undefined, deliveryDate: type === 'work' ? this.today() : undefined, needsReview: false };
  }

  /** Alias (csv) vince sempre; il collegamento predefinito del prodotto interviene solo se nessun alias corrisponde alla descrizione (anch'essa trattata come csv). */
  private autoDetectLotId(): string | undefined {
    if (this.draft.serviceId || !this.draft.productId) return undefined;
    const candidateLots = this.lots().filter((lot) => lot.productId === this.draft.productId);
    if (!candidateLots.length) return undefined;

    const descriptionTerms = this.parseCsvTerms(this.draft.description ?? '');
    const aliasMatch = descriptionTerms.length
      ? candidateLots.find((lot) => (lot.aliases ?? []).some((alias) => descriptionTerms.includes(alias.trim().toLowerCase())))
      : undefined;
    if (aliasMatch) return aliasMatch.id;

    const product = this.products().find((item) => item.id === this.draft.productId);
    return product?.defaultLotId && candidateLots.some((lot) => lot.id === product.defaultLotId) ? product.defaultLotId : undefined;
  }

  private parseCsvTerms(value: string): readonly string[] {
    return value.split(',').map((term) => term.trim().toLowerCase()).filter(Boolean);
  }

  private defaultLotForProduct(productId: string): string | undefined {
    const product = this.products().find((item) => item.id === productId);
    return product?.defaultLotId && this.lots().some((lot) => lot.id === product.defaultLotId) ? product.defaultLotId : undefined;
  }

  private filterOperations(operations: readonly Operation[]): readonly Operation[] {
    if (this.worksOnly) return operations.filter((operation) => Boolean(operation.workStatus));
    if (this.salesOnly) return operations.filter((operation) => operation.type === 'sale' || operation.type === 'bundle' || Boolean(operation.bundleId));
    return operations;
  }

  protected hasPaymentDraft(): boolean { return typeof this.paymentDraft.amount === 'number' || Boolean(this.paymentDraft.paymentMethodId); }
  private ensurePaymentDoesNotExceedTotal(total: number, alreadyPaid: number, paymentAmount: number): void {
    if (alreadyPaid + paymentAmount > total + 0.005) throw new Error('La somma dei pagamenti non puo superare l\'importo della vendita.');
  }
  private emptyPaymentDraft(): PaymentDraft { return { amount: undefined, paymentDate: new Date().toISOString().slice(0, 10), paymentMethodId: '' }; }
  private today(): string { return new Date().toISOString().slice(0, 10); }
  private dateTimeInputValue(value: string): string { const date = new Date(value); const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
  private toIsoDateTime(value?: string): string { return value ? new Date(value).toISOString() : new Date().toISOString(); }
  private defaultPaymentMethodId(): string { return this.paymentMethods().find((paymentMethod) => paymentMethod.id === 'system-payment-method-contanti')?.id ?? 'system-payment-method-contanti'; }
}
