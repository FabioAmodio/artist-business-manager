import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BundleService } from '../../application/bundles/bundle.service';
import { FairService } from '../../application/fairs/fair.service';
import { ClientService } from '../../application/clients/client.service';
import { OperationService } from '../../application/operations/operation.service';
import { PaymentMethodService } from '../../application/payment-methods/payment-method.service';
import { PaymentService } from '../../application/payments/payment.service';
import { ProductService } from '../../application/products/product.service';
import { PurchaseService } from '../../application/purchases/purchase.service';
import { ServiceService } from '../../application/services/service.service';
import type { Fair } from '../../domain/models/fair';
import type { Bundle } from '../../domain/models/bundle';
import type { Operation } from '../../domain/models/operation';
import type { Party } from '../../domain/models/party';
import type { Payment } from '../../domain/models/payment';
import type { PaymentMethod } from '../../domain/models/payment-method';
import type { Product } from '../../domain/models/product';
import type { Purchase } from '../../domain/models/purchase';
import type { Service } from '../../domain/models/service';
import { annualDashboardMetrics, availableYearRange } from '../../domain/shared/annual-dashboard';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { ActiveFairService } from '../../core/event/active-fair.service';
import { SyncStatusService } from '../../core/synchronization/sync-status.service';
import { SwipeRowComponent } from '../../shared/components/swipe-row/swipe-row.component';
import type { SwipeAction } from '../../shared/components/swipe-row/swipe-row.model';

interface PaymentDraft {
  amount?: number;
  paymentDate: string;
  paymentMethodId: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, RouterLink, SwipeRowComponent],
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage implements OnInit {
  @ViewChild('fairEconomicsDialog') private fairEconomicsDialog?: ElementRef<HTMLDialogElement>;
  private readonly router = inject(Router);
  protected readonly activeFairMode = inject(ActiveFairService);
  private readonly syncStatus = inject(SyncStatusService);
  private readonly fairService = inject(FairService);
  private readonly bundleService = inject(BundleService);
  private readonly operationService = inject(OperationService);
  private readonly clientService = inject(ClientService);
  private readonly paymentService = inject(PaymentService);
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly productService = inject(ProductService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly serviceService = inject(ServiceService);

  protected readonly activeFair = this.activeFairMode.activeFair;
  protected readonly operations = signal<readonly Operation[]>([]);
  protected readonly parties = signal<readonly Party[]>([]);
  protected readonly payments = signal<readonly Payment[]>([]);
  protected readonly paymentMethods = signal<readonly PaymentMethod[]>([]);
  protected readonly products = signal<readonly Product[]>([]);
  protected readonly purchases = signal<readonly Purchase[]>([]);
  protected readonly services = signal<readonly Service[]>([]);
  protected readonly bundles = signal<readonly Bundle[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly transitioningId = signal<string | null>(null);
  protected readonly paymentSale = signal<Operation | null>(null);
  protected readonly savingPayment = signal(false);
  protected readonly forceFairDialogOpen = signal(false);
  protected readonly fairEconomicsDialogOpen = signal(false);
  protected readonly openRowId = signal<string | null>(null);

  protected saleRightActions(sale: Operation): SwipeAction[] {
    const actions: SwipeAction[] = [];
    if (!this.isFullyPaid(sale)) actions.push({ key: 'quick-payment', icon: '€', label: 'Paga', variant: 'neutral-success', run: () => this.openPaymentDialog(sale) });
    actions.push({ key: 'edit', icon: '✎', label: 'Modifica', kind: 'auto', run: () => this.editOperation(sale) });
    return actions;
  }
  protected readonly expandedWorks = signal<ReadonlySet<string>>(new Set());
  protected readonly expandedSales = signal<ReadonlySet<string>>(new Set());
  protected readonly statusDragX = signal(0);
  protected statusDragOperationId: string | null = null;
  private statusDragStartX = 0;
  private statusDragConsumed = false;
  protected readonly forcingFair = signal(false);
  protected readonly dashboardView = signal<'fair' | 'annual'>('fair');
  protected forcedFairSelection = '';
  protected readonly selectedYear = signal(new Date().getFullYear());
  protected readonly yearRange = computed(() => availableYearRange({ operations: this.operations(), payments: this.payments(), fairs: this.fairs(), purchases: this.purchases(), products: this.products(), services: this.services(), bundles: this.bundles() }, new Date().getFullYear()));
  protected readonly annualMetrics = computed(() => annualDashboardMetrics({ operations: this.operations(), payments: this.payments(), fairs: this.fairs(), purchases: this.purchases(), products: this.products(), services: this.services(), bundles: this.bundles() }, this.selectedYear(), this.today()));
  protected paymentDraft: PaymentDraft = this.emptyPaymentDraft();
  protected readonly fairs = signal<readonly Fair[]>([]);
  private touchStartX: number | null = null;
  private handledSyncVersion = 0;

  constructor() {
    effect(() => {
      const completedVersion = this.syncStatus.completedVersion();
      const dialogOpen = this.forceFairDialogOpen() || this.paymentSale() !== null;
      if (completedVersion > this.handledSyncVersion && !dialogOpen) {
        this.handledSyncVersion = completedVersion;
        void this.load();
      }
    });
  }
  protected readonly activeWorks = computed(() => {
    const fairId = this.activeFair()?.id;
    return fairId ? this.operations().filter((operation) => operation.fairEditionId === fairId && (operation.workStatus === 'requested' || operation.workStatus === 'in-progress' || operation.workStatus === 'completed')) : [];
  });
  protected readonly fairSales = computed(() => {
    const fairId = this.activeFair()?.id;
    return fairId ? this.operations()
      .filter((operation) => operation.fairEditionId === fairId && !operation.parentOperationId && (operation.type === 'sale' || operation.type === 'bundle'))
      .sort((first, second) => (second.operationDate ?? second.createdAt).localeCompare(first.operationDate ?? first.createdAt)) : [];
  });
  protected readonly displayedFair = computed(() => this.dashboardView() === 'fair' ? this.activeFair() : null);
  protected readonly dashboardViewOptions = computed(() => this.activeFair() ? [
    { value: 'fair', label: this.activeFair()!.name },
    { value: 'annual', label: 'Riepilogo annuale' },
  ] : []);

  ngOnInit(): void { void this.load(); }

  protected totalCosts(fair: Fair): number | undefined {
    const values = [fair.standCost, fair.hotelCost, fair.travelCost, fair.otherCosts].filter((value): value is number => typeof value === 'number');
    return values.length ? values.reduce((sum, value) => sum + value, 0) : undefined;
  }

  protected fairRevenue(fair: Fair): number | undefined {
    const sales = this.operations()
      .filter((operation) => operation.fairEditionId === fair.id && (operation.type === 'sale' || (operation.type === 'work' && Boolean(operation.parentOperationId))))
      .reduce((total, operation) => total + (operation.amount ?? 0), 0);
    if (!sales && typeof fair.reimbursement !== 'number') return undefined;
    return sales + (fair.reimbursement ?? 0);
  }

  protected fairBalance(fair: Fair): number | undefined {
    const revenue = this.fairRevenue(fair);
    const costs = this.totalCosts(fair);
    if (typeof revenue !== 'number' && typeof costs !== 'number') return undefined;
    return (revenue ?? 0) - (costs ?? 0);
  }

  protected fairSalesTotal(fair: Fair): number { return this.operations().filter((operation) => operation.fairEditionId === fair.id && !operation.parentOperationId && (operation.type === 'sale' || operation.type === 'bundle')).reduce((total, operation) => total + (operation.amount ?? 0), 0); }
  protected handleSaleSummaryClick(operation: Operation, event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('.customer-link')) {
      event.preventDefault();
      event.stopPropagation();
      this.openFairCustomerSales(operation);
      return;
    }
    this.toggleSaleDetails(operation);
  }
  protected openFairCustomerSales(operation: Operation): void {
    const fairId = this.activeFair()?.id;
    if (!operation.partyId || !fairId) return;
    void this.router.navigate(['/sales'], { queryParams: { customer: operation.partyId, fairEdition: fairId } });
  }
  protected openFairEconomics(fair: Fair): void {
    this.fairEconomicsDialogOpen.set(true);
    setTimeout(() => {
      const dialog = this.fairEconomicsDialog?.nativeElement;
      if (dialog && !dialog.open) dialog.showModal();
    });
  }
  protected closeFairEconomics(): void {
    const dialog = this.fairEconomicsDialog?.nativeElement;
    if (dialog?.open) dialog.close();
    this.fairEconomicsDialogOpen.set(false);
  }

  protected isCostCovered(fair: Fair, cost: 'stand' | 'travel' | 'hotel' | 'other'): boolean {
    let available = this.fairRevenue(fair) ?? 0;
    for (const currentCost of ['stand', 'travel', 'hotel', 'other'] as const) {
      const amount = this.costAmount(fair, currentCost) ?? 0;
      if (currentCost === cost) return available >= amount;
      available -= amount;
    }
    return false;
  }

  protected coverageLabel(fair: Fair, cost: 'stand' | 'travel' | 'hotel' | 'other'): string {
    const labels = { stand: 'Stand', travel: 'Viaggio', hotel: 'Hotel', other: 'Altri costi' };
    return `${labels[cost]} ${this.isCostCovered(fair, cost) ? 'coperto' : 'non coperto'}`;
  }

  protected hasOtherCosts(fair: Fair): boolean { return (fair.otherCosts ?? 0) !== 0; }
  protected formatMoney(value: number | undefined): string { return typeof value === 'number' ? `${value.toFixed(2)} €` : 'n.d.'; }
  protected formatDate(value?: string): string { return value ? new Intl.DateTimeFormat('it-IT').format(new Date(`${value.slice(0, 10)}T00:00:00`)) : 'Non indicata'; }
  protected formatDateTime(value?: string): string { return value ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Non indicata'; }
  protected customerLabel(operation: Operation): string { return this.parties().find((party) => party.id === operation.partyId)?.displayName ?? operation.customerName ?? 'Cliente non indicato'; }
  protected operationDisplayName(operation: Operation): string {
    if (operation.bundleId) return this.bundles().find((bundle) => bundle.id === operation.bundleId)?.name ?? operation.title;
    if (operation.serviceId) return this.services().find((service) => service.id === operation.serviceId)?.description ?? operation.title;
    if (operation.productId) return this.products().find((product) => product.id === operation.productId)?.name ?? operation.title;
    return operation.title;
  }
  protected workStatusLabel(operation: Operation): string { return operation.workStatus === 'completed' ? 'Terminata' : operation.workStatus === 'in-progress' ? 'In corso' : 'Richiesta'; }
  protected workStatusIcon(operation: Operation): string { return operation.workStatus === 'completed' ? '✓' : operation.workStatus === 'in-progress' ? '🛠️' : '📝'; }
  protected workStatusIconFor(status: Operation['workStatus'] | null): string { return status === 'completed' ? '✓' : status === 'delivered' ? '📦' : status === 'in-progress' ? '🛠️' : status === 'requested' ? '📝' : '🚫'; }
  protected workAdvanceLabel(operation: Operation): string { return operation.workStatus === 'in-progress' ? 'Segna come terminata' : operation.workStatus === 'completed' ? 'Segna come consegnata' : 'Inizia lavorazione'; }
  protected workAdvanceIcon(operation: Operation): string { return operation.workStatus === 'in-progress' ? '✓' : operation.workStatus === 'completed' ? '📦' : '▶'; }
  protected workNextStatus(operation: Operation): NonNullable<Operation['workStatus']> | null {
    return operation.workStatus === 'requested' ? 'in-progress' : operation.workStatus === 'in-progress' ? 'completed' : operation.workStatus === 'completed' ? 'delivered' : null;
  }
  protected workNextStatusIcon(operation: Operation): string { const nextStatus = this.workNextStatus(operation); return this.workStatusIconFor(nextStatus); }
  protected workPreviousStatusIcon(operation: Operation): string { return this.workStatusIconFor(this.workPreviousStatus(operation)); }
  protected workPreviousStatus(operation: Operation): NonNullable<Operation['workStatus']> | null {
    return operation.workStatus === 'delivered' ? 'completed' : operation.workStatus === 'completed' ? 'in-progress' : operation.workStatus === 'in-progress' ? 'requested' : operation.workStatus === 'requested' ? 'cancelled' : null;
  }
  /** Etichetta sintetica per il pulsante di swipe, non l'etichetta lunga usata altrove. */
  protected workStatusLabelFor(status: Operation['workStatus'] | null): string {
    return status === 'completed' ? 'Terminata' : status === 'delivered' ? 'Cons/sped' : status === 'in-progress' ? 'In corso' : status === 'requested' ? 'Richiesta' : status === 'cancelled' ? 'Cancellata' : 'Non indicata';
  }
  protected workRightActions(work: Operation): SwipeAction[] {
    const actions: SwipeAction[] = [];
    const next = this.workNextStatus(work);
    if (next) actions.push({ key: 'advance', icon: this.workStatusIconFor(next), label: this.workStatusLabelFor(next), variant: 'neutral', run: () => this.advanceWork(work) });
    if (!this.isFullyPaid(work)) actions.push({ key: 'quick-payment', icon: '€', label: 'Paga', variant: 'neutral-success', run: () => this.openPaymentDialog(work) });
    actions.push({ key: 'edit', icon: '✎', label: 'Modifica', kind: 'auto', run: () => this.editOperation(work) });
    return actions;
  }
  protected workLeftActions(work: Operation): SwipeAction[] {
    const previous = this.workPreviousStatus(work);
    if (!previous) return [];
    return [{ key: 'regress', icon: this.workStatusIconFor(previous), label: this.workStatusLabelFor(previous), variant: previous === 'cancelled' ? 'neutral-warning' : 'neutral', run: () => this.transitionWork(work, previous) }];
  }
  protected statusDragStart(operation: Operation, event: PointerEvent): void {
    this.statusDragOperationId = operation.id;
    this.statusDragStartX = event.clientX;
    this.statusDragConsumed = false;
    this.statusDragX.set(0);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  protected statusDragMove(operation: Operation, event: PointerEvent): void {
    if (this.statusDragOperationId !== operation.id) return;
    const distance = Math.max(-72, Math.min(72, event.clientX - this.statusDragStartX));
    if (Math.abs(distance) >= 8) this.statusDragConsumed = true;
    this.statusDragX.set(distance);
  }
  protected async statusDragEnd(operation: Operation, event: PointerEvent): Promise<void> {
    if (this.statusDragOperationId !== operation.id) return;
    const distance = this.statusDragX();
    this.statusDragOperationId = null;
    this.statusDragX.set(0);
    if (Math.abs(distance) < 40) return;
    const target = distance > 0 ? this.workNextStatus(operation) : this.workPreviousStatus(operation);
    if (target) await this.transitionWork(operation, target);
    setTimeout(() => { this.statusDragConsumed = false; });
  }
  protected async handleStatusSlideClick(operation: Operation): Promise<void> {
    if (this.statusDragConsumed) return;
    await this.advanceWork(operation);
  }
  protected workSummary(operation: Operation): string { const name = this.operationDisplayName(operation); return operation.description?.trim() ? `${name} - ${operation.description.trim()}` : name; }
  protected isWorkExpanded(operation: Operation): boolean { return this.expandedWorks().has(operation.id); }
  protected toggleWorkDetails(operation: Operation): void {
    const expanded = new Set(this.expandedWorks());
    if (expanded.has(operation.id)) expanded.delete(operation.id); else expanded.add(operation.id);
    this.expandedWorks.set(expanded);
  }
  protected isSaleExpanded(operation: Operation): boolean { return this.expandedSales().has(operation.id); }
  protected toggleSaleDetails(operation: Operation): void {
    const expanded = new Set(this.expandedSales());
    if (expanded.has(operation.id)) expanded.delete(operation.id); else expanded.add(operation.id);
    this.expandedSales.set(expanded);
  }
  protected paymentTotal(operationId: string): number { return this.payments().filter((payment) => payment.operationId === operationId).reduce((total, payment) => total + payment.amount, 0); }
  protected paymentTotalFor(operation: Operation): number {
    if (!operation.parentOperationId) return this.paymentTotal(operation.id);
    const parent = this.operations().find((item) => item.id === operation.parentOperationId);
    if (!parent || (parent.amount ?? 0) <= 0) return this.paymentTotal(operation.id);
    return Math.min(operation.amount ?? 0, this.paymentTotal(parent.id) * (operation.amount ?? 0) / (parent.amount ?? 0));
  }
  protected paymentRemaining(operation: Operation): number { return Math.max((operation.amount ?? 0) - this.paymentTotalFor(operation), 0); }
  protected paymentTarget(operation: Operation): Operation {
    return operation.parentOperationId ? this.operations().find((item) => item.id === operation.parentOperationId) ?? operation : operation;
  }
  protected workPaymentSummary(operation: Operation): string { return this.formatMoney(operation.amount); }
  protected workPaymentAriaLabel(operation: Operation): string { return `Totale ${this.formatMoney(operation.amount)}, residuo ${this.formatMoney(this.paymentRemaining(operation))}`; }
  protected isFullyPaid(operation: Operation): boolean { return (operation.amount ?? 0) <= 0 || this.paymentRemaining(operation) < 0.005; }

  protected changeYear(offset: -1 | 1): void {
    const next = this.selectedYear() + offset;
    const range = this.yearRange();
    if (next >= range.min && next <= range.max) this.selectedYear.set(next);
  }

  protected openFairSale(): void {
    void this.router.navigate(['/sales'], { queryParams: { create: Date.now().toString() } });
  }

  protected openFairWork(): void {
    void this.router.navigate(['/works'], { queryParams: { create: Date.now().toString() } });
  }

  protected editOperation(operation: Operation): void {
    void this.router.navigate([operation.type === 'work' ? '/works' : '/sales'], { queryParams: { open: operation.id } });
  }

  protected changeDashboardView(value: string): void {
    if (value === 'fair' || value === 'annual') this.dashboardView.set(value);
  }

  protected openForceFairDialog(): void {
    this.forcedFairSelection = this.fairs()[0]?.id ?? '';
    this.forceFairDialogOpen.set(true);
  }

  protected closeForceFairDialog(): void {
    if (!this.forcingFair()) this.forceFairDialogOpen.set(false);
  }

  protected async forceSelectedFair(): Promise<void> {
    if (!this.forcedFairSelection) return;
    this.forcingFair.set(true);
    this.errorMessage.set('');
    try {
      await this.activeFairMode.forceFair(this.forcedFairSelection);
      this.forceFairDialogOpen.set(false);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile forzare la modalità fiera.');
    } finally {
      this.forcingFair.set(false);
    }
  }

  protected startYearSwipe(event: TouchEvent): void { this.touchStartX = this.displayedFair() || document.querySelector('[role="dialog"]') ? null : event.changedTouches[0]?.clientX ?? null; }
  protected endYearSwipe(event: TouchEvent): void {
    if (this.touchStartX === null || document.querySelector('[role="dialog"]')) {
      this.touchStartX = null;
      return;
    }
    const distance = (event.changedTouches[0]?.clientX ?? this.touchStartX) - this.touchStartX;
    this.touchStartX = null;
    if (Math.abs(distance) < 50) return;
    this.changeYear(distance < 0 ? 1 : -1);
  }

  protected openPaymentDialog(operation: Operation): void {
    this.paymentSale.set(operation);
    this.paymentDraft = { amount: this.paymentRemaining(operation), paymentDate: this.today(), paymentMethodId: this.defaultPaymentMethodId() };
    this.errorMessage.set('');
  }

  protected closePaymentDialog(): void {
    if (this.savingPayment()) return;
    this.paymentSale.set(null);
    this.paymentDraft = this.emptyPaymentDraft();
  }

  protected async addPayment(): Promise<void> {
    const operation = this.paymentSale();
    const amount = this.paymentDraft.amount;
    if (!operation || typeof amount !== 'number' || amount <= 0 || !this.paymentDraft.paymentDate || !this.paymentDraft.paymentMethodId) return;
    if (amount > this.paymentRemaining(operation) + 0.005) {
      this.errorMessage.set('Il pagamento non può superare l\'importo residuo della vendita.');
      return;
    }
    this.savingPayment.set(true);
    this.errorMessage.set('');
    try {
      await this.paymentService.create({ operationId: this.paymentTarget(operation).id, amount, paymentDate: this.paymentDraft.paymentDate, paymentMethodId: this.paymentDraft.paymentMethodId });
      this.payments.set(await this.paymentService.list());
      this.paymentSale.set(null);
      this.paymentDraft = this.emptyPaymentDraft();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile registrare il pagamento.');
    } finally {
      this.savingPayment.set(false);
    }
  }

  protected async advanceWork(operation: Operation): Promise<void> {
    const nextStatus = this.workNextStatus(operation);
    if (nextStatus) await this.transitionWork(operation, nextStatus);
  }
  private async transitionWork(operation: Operation, status: NonNullable<Operation['workStatus']>): Promise<void> {
    this.transitioningId.set(operation.id);
    this.errorMessage.set('');
    try {
      const updated = await this.operationService.transitionWorkStatus(operation.id, status);
      this.operations.update((operations) => operations.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile aggiornare la lavorazione.');
    } finally {
      this.transitioningId.set(null);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const today = new Date().toISOString().slice(0, 10);
    try {
      const [fairs, operations, parties, payments, paymentMethods, products, purchases, services, bundles] = await Promise.all([this.fairService.list(), this.operationService.list('all'), this.clientService.list(), this.paymentService.list(), this.paymentMethodService.list(), this.productService.list(), this.purchaseService.list(), this.serviceService.list(), this.bundleService.list()]);
      this.fairs.set(fairs);
      this.activeFairMode.setFairs(fairs);
      this.operations.set(operations);
      this.parties.set(parties);
      this.payments.set(payments);
      this.paymentMethods.set(paymentMethods);
      this.products.set(products);
      this.purchases.set(purchases);
      this.services.set(services);
      this.bundles.set(bundles);
    } catch {
      this.errorMessage.set('Impossibile caricare il riepilogo.');
    } finally {
      this.loading.set(false);
    }
  }

  private costAmount(fair: Fair, cost: 'stand' | 'travel' | 'hotel' | 'other'): number | undefined {
    return { stand: fair.standCost, travel: fair.travelCost, hotel: fair.hotelCost, other: fair.otherCosts }[cost];
  }

  private emptyPaymentDraft(): PaymentDraft { return { amount: undefined, paymentDate: this.today(), paymentMethodId: '' }; }
  private today(): string { return new Date().toISOString().slice(0, 10); }
  private defaultPaymentMethodId(): string { return this.paymentMethods().find((method) => method.id === 'system-payment-method-contanti')?.id ?? 'system-payment-method-contanti'; }
}
