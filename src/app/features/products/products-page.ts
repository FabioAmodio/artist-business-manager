import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LotService, type LotInput } from '../../application/lots/lot.service';
import { ProductService, type ProductInput } from '../../application/products/product.service';
import { OperationService } from '../../application/operations/operation.service';
import { PurchaseService } from '../../application/purchases/purchase.service';
import type { Lot } from '../../domain/models/lot';
import type { Operation } from '../../domain/models/operation';
import type { Product } from '../../domain/models/product';
import type { Purchase } from '../../domain/models/purchase';
import { FormActionsComponent } from '../../shared/components/form-actions.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, FormActionsComponent, FormsModule, PageHeaderComponent],
  selector: 'app-products-page',
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
})
export class ProductsPage implements OnInit {
  private readonly service = inject(ProductService);
  private readonly lotService = inject(LotService);
  private readonly operationService = inject(OperationService);
  private readonly purchaseService = inject(PurchaseService);
  protected readonly products = signal<readonly Product[]>([]);
  protected readonly lots = signal<readonly Lot[]>([]);
  protected readonly operations = signal<readonly Operation[]>([]);
  protected readonly purchases = signal<readonly Purchase[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly activeFilter = signal<'all' | 'active' | 'inactive'>('all');
  protected readonly filtersOpen = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected draft: ProductInput = this.emptyDraft();
  protected tagText = '';
  protected readonly lotDialogOpen = signal(false);
  protected readonly lotListDialogOpen = signal(false);
  protected readonly lotEditingId = signal<string | null>(null);
  protected readonly lotProductId = signal<string | null>(null);
  protected lotDraft: LotInput = this.emptyLotDraft();
  protected lotAliasText = '';

  ngOnInit(): void { void this.load(); }

  protected async applyFilters(): Promise<void> { await this.load(); }

  protected productLots(productId: string): readonly Lot[] { return this.lots().filter((lot) => lot.productId === productId); }
  protected isProductUsed(product: Product): boolean {
    return this.operations().some((operation) => operation.productId === product.id) || this.purchases().some((purchase) => purchase.productId === product.id) || this.productLots(product.id).length > 0;
  }
  protected editingProductLots(): readonly Lot[] { return this.editingId() ? this.productLots(this.editingId()!) : []; }
  protected isDefaultLot(lot: Lot): boolean {
    return this.products().find((product) => product.id === lot.productId)?.defaultLotId === lot.id;
  }

  protected visibleProducts(): readonly Product[] {
    const active = this.activeFilter();
    return this.products()
      .filter((product) => active === 'all' || product.active === (active === 'active'));
  }
  protected hasActiveFilters(): boolean { return Boolean(this.query().trim()) || this.activeFilter() !== 'all'; }

  protected startCreating(): void {
    this.resetMessages();
    this.draft = this.emptyDraft();
    this.tagText = '';
    this.editingId.set(null);
    this.creating.set(true);
  }

  protected startEditing(product: Product): void {
    this.resetMessages();
    this.draft = {
      name: product.name,
      description: product.description ?? '',
      suggestedPrice: product.suggestedPrice,
      active: product.active,
      tags: product.tags,
    };
    this.tagText = product.tags.join(', ');
    this.editingId.set(product.id);
    this.creating.set(false);
  }

  protected cancelForm(): void {
    this.creating.set(false);
    this.editingId.set(null);
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.resetMessages();
    const input = { ...this.draft, tags: this.parseTags(this.tagText) };
    try {
      if (this.editingId()) await this.service.update(this.editingId()!, input);
      else await this.service.create(input);
      this.cancelForm();
      this.successMessage.set('Prodotto salvato localmente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il prodotto.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(product: Product): Promise<void> {
    if (!window.confirm(`Eliminare logicamente "${product.name}"?`)) return;
    this.resetMessages();
    try {
      await this.service.delete(product.id);
      this.successMessage.set('Prodotto eliminato logicamente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare il prodotto.');
    }
  }

  protected startCreatingLot(product: Product): void {
    this.resetMessages();
    this.lotListDialogOpen.set(false);
    this.lotProductId.set(product.id);
    this.lotEditingId.set(null);
    this.lotDraft = this.emptyLotDraft(product.id);
    this.lotAliasText = '';
    this.lotDialogOpen.set(true);
  }

  protected openProductLots(product: Product): void {
    this.resetMessages();
    this.lotProductId.set(product.id);
    this.lotListDialogOpen.set(true);
  }

  protected startEditingLot(lot: Lot): void {
    this.resetMessages();
    this.lotListDialogOpen.set(false);
    this.lotProductId.set(lot.productId);
    this.lotEditingId.set(lot.id);
    this.lotDraft = { name: lot.name, productId: lot.productId, purchaseId: lot.purchaseId, aliases: lot.aliases ?? [], notes: lot.notes ?? '' };
    this.lotAliasText = (lot.aliases ?? []).join(', ');
    this.lotDialogOpen.set(true);
  }

  protected cancelLotForm(): void { this.lotDialogOpen.set(false); this.lotEditingId.set(null); this.lotProductId.set(null); }
  protected closeLotList(): void { this.lotListDialogOpen.set(false); this.lotProductId.set(null); }

  protected async saveLot(): Promise<void> {
    this.saving.set(true);
    this.resetMessages();
    const input = { ...this.lotDraft, productId: this.lotProductId()!, aliases: this.parseTags(this.lotAliasText) };
    try {
      if (this.lotEditingId()) await this.lotService.update(this.lotEditingId()!, input);
      else await this.lotService.create(input);
      this.cancelLotForm();
      this.successMessage.set('Collegamento salvato localmente.');
      await this.load();
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il collegamento.'); }
    finally { this.saving.set(false); }
  }

  protected async removeLot(lot: Lot): Promise<void> {
    if (!window.confirm(`Eliminare logicamente "${lot.name}"?`)) return;
    await this.lotService.delete(lot.id);
    if (this.isDefaultLot(lot)) await this.service.setDefaultLot(lot.productId, undefined);
    this.lots.set(await this.lotService.list());
    this.products.set(await this.service.list(this.query()));
  }

  protected async toggleDefaultLot(lot: Lot): Promise<void> {
    this.resetMessages();
    try {
      await this.service.setDefaultLot(lot.productId, this.isDefaultLot(lot) ? undefined : lot.id);
      this.products.set(await this.service.list(this.query()));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile aggiornare il collegamento predefinito.');
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [products, lots, operations, purchases] = await Promise.all([this.service.list(this.query()), this.lotService.list(), this.operationService.list(), this.purchaseService.list()]);
      this.products.set(products);
      this.lots.set(lots);
      this.operations.set(operations);
      this.purchases.set(purchases);
    } catch {
      this.errorMessage.set('Impossibile caricare i prodotti.');
    } finally {
      this.loading.set(false);
    }
  }

  private resetMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private parseTags(value: string): readonly string[] {
    return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  }

  private emptyDraft(): ProductInput {
    return { name: '', description: '', suggestedPrice: undefined, active: true, tags: [] };
  }

  private emptyLotDraft(productId = ''): LotInput { return { name: '', productId, purchaseId: undefined, aliases: [], notes: '' }; }
}