import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
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

interface PaymentDraft {
  amount?: number;
  paymentDate: string;
  paymentMethodId: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, RouterLink],
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage implements OnInit {
  private readonly router = inject(Router);
  private readonly fairService = inject(FairService);
  private readonly bundleService = inject(BundleService);
  private readonly operationService = inject(OperationService);
  private readonly clientService = inject(ClientService);
  private readonly paymentService = inject(PaymentService);
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly productService = inject(ProductService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly serviceService = inject(ServiceService);

  protected readonly activeFair = signal<Fair | null>(null);
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
  protected readonly selectedYear = signal(new Date().getFullYear());
  protected readonly yearRange = computed(() => availableYearRange({ operations: this.operations(), payments: this.payments(), fairs: this.fairs(), purchases: this.purchases(), products: this.products(), services: this.services(), bundles: this.bundles() }, new Date().getFullYear()));
  protected readonly annualMetrics = computed(() => annualDashboardMetrics({ operations: this.operations(), payments: this.payments(), fairs: this.fairs(), purchases: this.purchases(), products: this.products(), services: this.services(), bundles: this.bundles() }, this.selectedYear(), this.today()));
  protected paymentDraft: PaymentDraft = this.emptyPaymentDraft();
  private readonly fairs = signal<readonly Fair[]>([]);
  private touchStartX: number | null = null;
  protected readonly activeWorks = computed(() => {
    const fairId = this.activeFair()?.id;
    return fairId ? this.operations().filter((operation) => operation.fairEditionId === fairId && (operation.workStatus === 'requested' || operation.workStatus === 'in-progress')) : [];
  });
  protected readonly fairSales = computed(() => {
    const fairId = this.activeFair()?.id;
    return fairId ? this.operations()
      .filter((operation) => operation.fairEditionId === fairId && !operation.parentOperationId && (operation.type === 'sale' || operation.type === 'bundle'))
      .sort((first, second) => (second.operationDate ?? second.createdAt).localeCompare(first.operationDate ?? first.createdAt)) : [];
  });

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
  protected workStatusLabel(operation: Operation): string { return operation.workStatus === 'in-progress' ? 'In corso' : 'Richiesta'; }
  protected workStatusIcon(operation: Operation): string { return operation.workStatus === 'in-progress' ? '🛠️' : '📝'; }
  protected paymentTotal(operationId: string): number { return this.payments().filter((payment) => payment.operationId === operationId).reduce((total, payment) => total + payment.amount, 0); }
  protected paymentRemaining(operation: Operation): number { return Math.max((operation.amount ?? 0) - this.paymentTotal(operation.id), 0); }
  protected isFullyPaid(operation: Operation): boolean { return (operation.amount ?? 0) <= 0 || this.paymentRemaining(operation) < 0.005; }

  protected changeYear(offset: -1 | 1): void {
    const next = this.selectedYear() + offset;
    const range = this.yearRange();
    if (next >= range.min && next <= range.max) this.selectedYear.set(next);
  }

  protected openFairSale(): void {
    void this.router.navigate(['/sales'], { queryParams: { create: Date.now().toString() } });
  }

  protected startYearSwipe(event: TouchEvent): void { this.touchStartX = event.changedTouches[0]?.clientX ?? null; }
  protected endYearSwipe(event: TouchEvent): void {
    if (this.touchStartX === null) return;
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
      await this.paymentService.create({ operationId: operation.id, amount, paymentDate: this.paymentDraft.paymentDate, paymentMethodId: this.paymentDraft.paymentMethodId });
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
    const status = operation.workStatus === 'requested' ? 'in-progress' : 'delivered';
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
      this.activeFair.set(fairs.find((fair) => fair.startDate <= today && today <= fair.endDate) ?? null);
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
