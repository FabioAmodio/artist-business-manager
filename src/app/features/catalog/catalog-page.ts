import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BundleService } from '../../application/bundles/bundle.service';
import { LotService, type LotInput } from '../../application/lots/lot.service';
import { OperationService } from '../../application/operations/operation.service';
import { ProductService, type ProductInput } from '../../application/products/product.service';
import { PurchaseService } from '../../application/purchases/purchase.service';
import { ServiceService, type ServiceInput } from '../../application/services/service.service';
import type { Bundle, BundleInput } from '../../domain/models/bundle';
import type { Lot } from '../../domain/models/lot';
import type { Operation } from '../../domain/models/operation';
import type { Product } from '../../domain/models/product';
import type { Purchase } from '../../domain/models/purchase';
import type { Service } from '../../domain/models/service';

interface BundleDraftItem {
  id: string;
  catalogKind: 'product' | 'service';
  catalogId: string;
  quantity: number;
  amount?: number;
  percentage?: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DecimalPipe, FormsModule],
  selector: 'app-catalog-page',
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly serviceService = inject(ServiceService);
  private readonly bundleService = inject(BundleService);
  private readonly lotService = inject(LotService);
  private readonly operationService = inject(OperationService);
  private readonly purchaseService = inject(PurchaseService);

  protected readonly products = signal<readonly Product[]>([]);
  protected readonly services = signal<readonly Service[]>([]);
  protected readonly bundles = signal<readonly Bundle[]>([]);
  protected readonly lots = signal<readonly Lot[]>([]);
  protected readonly operations = signal<readonly Operation[]>([]);
  protected readonly purchases = signal<readonly Purchase[]>([]);
  protected readonly lotDialogOpen = signal(false);
  protected readonly lotEditingId = signal<string | null>(null);
  protected readonly lotProductId = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly createMode = signal<'product' | 'service' | 'bundle' | null>(null);
  protected readonly editingType = signal<'product' | 'service' | 'bundle' | null>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected productDraft: ProductInput = this.emptyProductDraft();
  protected productTagText = '';
  protected serviceDraft: ServiceInput = this.emptyServiceDraft();
  protected bundleDraft: { name: string; description: string; active: boolean; bundlePrice?: number } = this.emptyBundleDraft();
  protected bundleItems = signal<BundleDraftItem[]>([]);
  protected lotDraft: LotInput = this.emptyLotDraft();
  protected lotAliasText = '';

  ngOnInit(): void { void this.load(); }

  protected itemTypeLabel(type: 'product' | 'service' | 'bundle'): string {
    return type === 'product' ? 'Prodotto' : type === 'service' ? 'Servizio' : 'Pacchetto';
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [products, services, bundles, lots, operations, purchases] = await Promise.all([
        this.productService.list(), this.serviceService.list(), this.bundleService.list(),
        this.lotService.list(), this.operationService.list(), this.purchaseService.list(),
      ]);
      this.products.set(products);
      this.services.set(services);
      this.bundles.set(bundles);
      this.lots.set(lots);
      this.operations.set(operations);
      this.purchases.set(purchases);
    } catch {
      this.errorMessage.set('Impossibile caricare il catalogo.');
    } finally {
      this.loading.set(false);
    }
  }

  protected openCreate(type: 'product' | 'service' | 'bundle'): void {
    this.resetMessages();
    this.createMode.set(type);
    this.editingType.set(null);
    this.editingId.set(null);
    if (type === 'product') this.productDraft = this.emptyProductDraft();
    if (type === 'service') this.serviceDraft = this.emptyServiceDraft();
    if (type === 'bundle') {
      this.bundleDraft = this.emptyBundleDraft();
      this.bundleItems.set([]);
    }
  }

  protected async saveProduct(): Promise<void> {
    this.saving.set(true);
    this.resetMessages();
    try {
      const input: ProductInput = { ...this.productDraft, tags: this.parseList(this.productTagText) };
      if (this.editingId()) await this.productService.update(this.editingId()!, input);
      else await this.productService.create(input);
      this.createMode.set(null);
      this.successMessage.set('Prodotto salvato localmente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il prodotto.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async saveService(): Promise<void> {
    this.saving.set(true);
    this.resetMessages();
    try {
      if (this.editingId()) await this.serviceService.update(this.editingId()!, this.serviceDraft);
      else await this.serviceService.create(this.serviceDraft);
      this.createMode.set(null);
      this.successMessage.set('Servizio salvato localmente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il servizio.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async saveBundle(): Promise<void> {
    this.saving.set(true);
    this.resetMessages();
    try {
      const draftItems = this.bundleItems();
      const totalAmount = draftItems.reduce((total, item) => total + (item.amount ?? 0), 0);
      const hasAmounts = draftItems.some((item) => item.amount !== undefined);
      if (hasAmounts && draftItems.some((item) => item.amount === undefined)) throw new Error('Inserisci un importo per ogni componente oppure usa le percentuali.');
      if (hasAmounts && totalAmount <= 0) throw new Error('La somma degli importi deve essere maggiore di zero.');
      const input: BundleInput = {
        name: this.bundleDraft.name,
        description: this.bundleDraft.description,
        active: this.bundleDraft.active,
        bundlePrice: this.bundleDraft.bundlePrice,
        items: this.bundleItems().map((item) => ({
          id: item.id,
          catalogKind: item.catalogKind,
          catalogId: item.catalogId,
          quantity: item.quantity,
          percentage: hasAmounts ? ((item.amount ?? 0) / totalAmount) * 100 : item.percentage,
        })),
      };
      if (this.editingId()) await this.bundleService.update(this.editingId()!, input);
      else await this.bundleService.create(input);
      this.createMode.set(null);
      this.successMessage.set('Pacchetto salvato localmente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il pacchetto.');
    } finally {
      this.saving.set(false);
    }
  }

  protected addBundleItem(): void {
    this.bundleItems.update((items) => [...items, this.emptyBundleItem()]);
  }

  protected removeBundleItem(id: string): void {
    this.bundleItems.update((items) => items.filter((item) => item.id !== id));
  }

  protected bundleAmountTotal(): number {
    return this.bundleItems().reduce((total, item) => total + (item.amount ?? 0), 0);
  }

  protected productName(productId?: string): string {
    return this.products().find((product) => product.id === productId)?.name ?? 'Prodotto sconosciuto';
  }

  protected serviceDescription(serviceId?: string): string {
    return this.services().find((service) => service.id === serviceId)?.description ?? 'Servizio sconosciuto';
  }

  protected isProductUsed(product: Product): boolean {
    return this.operations().some((operation) => operation.productId === product.id)
      || this.purchases().some((purchase) => purchase.productId === product.id)
      || this.lots().some((lot) => lot.productId === product.id)
      || this.bundles().some((bundle) => bundle.items.some((item) => item.catalogKind === 'product' && item.catalogId === product.id));
  }

  protected isServiceUsed(service: Service): boolean {
    return this.operations().some((operation) => operation.serviceId === service.id)
      || this.bundles().some((bundle) => bundle.items.some((item) => item.catalogKind === 'service' && item.catalogId === service.id));
  }

  protected productLots(productId: string): readonly Lot[] {
    return this.lots().filter((lot) => lot.productId === productId);
  }

  protected isDefaultLot(lot: Lot): boolean {
    return this.products().find((product) => product.id === lot.productId)?.defaultLotId === lot.id;
  }

  protected startCreatingLot(product: Product): void {
    this.resetMessages();
    this.lotProductId.set(product.id);
    this.lotEditingId.set(null);
    this.lotDraft = this.emptyLotDraft(product.id);
    this.lotAliasText = '';
    this.lotDialogOpen.set(true);
  }

  protected startEditingLot(lot: Lot): void {
    this.resetMessages();
    this.lotProductId.set(lot.productId);
    this.lotEditingId.set(lot.id);
    this.lotDraft = { name: lot.name, productId: lot.productId, purchaseId: lot.purchaseId, aliases: lot.aliases ?? [], notes: lot.notes ?? '' };
    this.lotAliasText = (lot.aliases ?? []).join(', ');
    this.lotDialogOpen.set(true);
  }

  protected cancelLotForm(): void { this.lotDialogOpen.set(false); this.lotEditingId.set(null); this.lotProductId.set(null); }

  protected async saveLot(): Promise<void> {
    this.saving.set(true);
    this.resetMessages();
    const input = { ...this.lotDraft, productId: this.lotProductId()!, aliases: this.parseList(this.lotAliasText) };
    try {
      if (this.lotEditingId()) await this.lotService.update(this.lotEditingId()!, input);
      else await this.lotService.create(input);
      this.cancelLotForm();
      this.successMessage.set('Collegamento salvato localmente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il collegamento.');
    } finally { this.saving.set(false); }
  }

  protected async removeLot(lot: Lot): Promise<void> {
    if (!window.confirm(`Eliminare logicamente "${lot.name}"?`)) return;
    this.resetMessages();
    try {
      await this.lotService.delete(lot.id);
      if (this.isDefaultLot(lot)) await this.productService.setDefaultLot(lot.productId, undefined);
      this.successMessage.set('Collegamento eliminato logicamente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare il collegamento.');
    }
  }

  protected async toggleDefaultLot(lot: Lot): Promise<void> {
    this.resetMessages();
    try {
      await this.productService.setDefaultLot(lot.productId, this.isDefaultLot(lot) ? undefined : lot.id);
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile aggiornare il collegamento predefinito.');
    }
  }

  protected openProductManagement(product: Product): void {
    this.startEditingProduct(product);
  }

  protected startEditingProduct(product: Product): void {
    this.resetMessages();
    this.productDraft = { name: product.name, description: product.description ?? '', suggestedPrice: product.suggestedPrice, active: product.active, tags: product.tags };
    this.productTagText = product.tags.join(', ');
    this.createMode.set('product');
    this.editingType.set('product');
    this.editingId.set(product.id);
  }

  protected startEditingService(service: Service): void {
    this.resetMessages();
    this.serviceDraft = { code: service.code, description: service.description };
    this.createMode.set('service');
    this.editingType.set('service');
    this.editingId.set(service.id);
  }

  protected startEditingBundle(bundle: Bundle): void {
    this.resetMessages();
    this.bundleDraft = { name: bundle.name, description: bundle.description ?? '', active: bundle.active, bundlePrice: bundle.bundlePrice };
    this.bundleItems.set(bundle.items.map((item) => ({ ...item, amount: bundle.bundlePrice != null && item.percentage != null ? bundle.bundlePrice * item.percentage / 100 : undefined })));
    this.createMode.set('bundle');
    this.editingType.set('bundle');
    this.editingId.set(bundle.id);
  }

  protected async removeProduct(product: Product): Promise<void> {
    await this.removeCatalogItem(product.name, () => this.productService.delete(product.id), 'prodotto', this.isProductUsed(product));
  }

  protected async removeService(service: Service): Promise<void> {
    await this.removeCatalogItem(service.description, () => this.serviceService.delete(service.id), 'servizio', this.isServiceUsed(service));
  }

  protected productOrServiceLabel(item: Bundle['items'][number]): string {
    return item.catalogKind === 'product' ? this.productName(item.catalogId) : this.serviceDescription(item.catalogId);
  }

  protected bundleItemAmounts(bundle: Bundle): number {
    const productLookup = new Map(this.products().map((product) => [product.id, product]));
    const serviceLookup = new Map(this.services().map((service) => [service.id, service]));
    return this.bundleService.resolveItemAmounts(bundle, productLookup, serviceLookup).reduce((total, item) => total + item.amount, 0);
  }

  protected bundleTypeSummary(bundle: Bundle): string {
    return bundle.items.map((item) => `${item.quantity}x ${this.productOrServiceLabel(item)}`).join(' · ');
  }

  protected async removeBundle(bundle: Bundle): Promise<void> {
    if (!window.confirm(`Eliminare logicamente "${bundle.name}"?`)) return;
    this.resetMessages();
    try {
      await this.bundleService.delete(bundle.id);
      this.successMessage.set('Pacchetto eliminato logicamente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare il pacchetto.');
    }
  }

  private async removeCatalogItem(name: string, remove: () => Promise<void>, type: string, used: boolean): Promise<void> {
    if (used) {
      this.errorMessage.set(`Impossibile eliminare il ${type}: e ancora in uso.`);
      return;
    }
    if (!window.confirm(`Eliminare logicamente "${name}"?`)) return;
    this.resetMessages();
    try {
      await remove();
      this.successMessage.set(`${type[0].toUpperCase()}${type.slice(1)} eliminato logicamente.`);
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : `Impossibile eliminare il ${type}.`);
    }
  }

  protected clearCreateMode(): void {
    this.createMode.set(null);
    this.editingType.set(null);
    this.editingId.set(null);
  }

  protected parseList(value: string): readonly string[] {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }

  private emptyProductDraft(): ProductInput {
    return { name: '', description: '', suggestedPrice: undefined, active: true, tags: [] };
  }

  private emptyServiceDraft(): ServiceInput {
    return { code: '', description: '' };
  }

  private emptyBundleDraft(): { name: string; description: string; active: boolean; bundlePrice?: number } {
    return { name: '', description: '', active: true, bundlePrice: undefined };
  }

  private emptyBundleItem(): BundleDraftItem {
    return { id: crypto.randomUUID(), catalogKind: 'product', catalogId: this.products()[0]?.id ?? '', quantity: 1, amount: undefined, percentage: undefined };
  }

  private emptyLotDraft(productId = ''): LotInput { return { name: '', productId, purchaseId: undefined, aliases: [], notes: '' }; }

  private resetMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
