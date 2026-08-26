import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LotService, type LotInput } from '../../application/lots/lot.service';
import { OperationService } from '../../application/operations/operation.service';
import { ProductService } from '../../application/products/product.service';
import { PurchaseService, type PurchaseInput } from '../../application/purchases/purchase.service';
import { SupplierService } from '../../application/suppliers/supplier.service';
import type { Lot } from '../../domain/models/lot';
import type { Party } from '../../domain/models/party';
import type { Product } from '../../domain/models/product';
import type { Purchase } from '../../domain/models/purchase';
import { FormActionsComponent } from '../../shared/components/form-actions.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, FormActionsComponent, FormsModule],
  selector: 'app-purchases-page',
  templateUrl: './purchases-page.html',
  styleUrl: './purchases-page.scss',
})
export class PurchasesPage implements OnInit {
  private readonly service = inject(PurchaseService);
  private readonly lotService = inject(LotService);
  private readonly operationService = inject(OperationService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);
  protected readonly purchases = signal<readonly Purchase[]>([]);
  protected readonly lots = signal<readonly Lot[]>([]);
  protected readonly operations = signal<readonly import('../../domain/models/operation').Operation[]>([]);
  protected readonly products = signal<readonly Product[]>([]);
  protected readonly suppliers = signal<readonly Party[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected draft: PurchaseInput = this.emptyDraft();
  protected readonly lotDialogOpen = signal(false);
  protected readonly lotListDialogOpen = signal(false);
  protected readonly lotEditingId = signal<string | null>(null);
  protected readonly lotPurchaseId = signal<string | null>(null);
  protected lotDraft: LotInput = this.emptyLotDraft();
  protected lotAliasText = '';

  ngOnInit(): void { void this.loadAll(); }

  protected visiblePurchases(): readonly Purchase[] {
    const normalized = this.query().trim().toLowerCase();
    if (!normalized) return this.purchases();
    return this.purchases().filter((purchase) => `${purchase.purchaseDate} ${purchase.description} ${purchase.notes ?? ''} ${purchase.totalAmount} ${this.supplierName(purchase.supplierId)}`.toLowerCase().includes(normalized));
  }

  protected supplierName(id?: string): string {
    return this.suppliers().find((supplier) => supplier.id === id)?.displayName ?? 'Fornitore non indicato';
  }

  protected purchaseLots(purchaseId: string): readonly Lot[] { return this.lots().filter((lot) => lot.purchaseId === purchaseId); }
  protected isPurchaseUsed(purchase: Purchase): boolean { return this.purchaseLots(purchase.id).length > 0; }
  protected editingPurchaseLots(): readonly Lot[] { return this.editingId() ? this.purchaseLots(this.editingId()!) : []; }
  protected productName(id?: string): string { return this.products().find((product) => product.id === id)?.name ?? 'Prodotto non indicato'; }
  protected purchaseLabel(id?: string | null): string {
    const purchase = this.purchases().find((item) => item.id === id);
    return purchase ? `${purchase.purchaseDate} · ${purchase.description}` : 'Acquisto non indicato';
  }

  protected purchaseBalance(purchase: Purchase): number {
    const purchaseLotIds = new Set(this.lots().filter((lot) => lot.purchaseId === purchase.id).map((lot) => lot.id));
    const salesTotal = this.operations()
      .filter((operation) => operation.type === 'sale' && operation.lotId && purchaseLotIds.has(operation.lotId))
      .reduce((total, operation) => total + (operation.amount ?? 0), 0);
    return salesTotal - purchase.totalAmount;
  }

  protected startCreating(): void {
    this.resetMessages();
    this.draft = this.emptyDraft();
    this.editingId.set(null);
    this.creating.set(true);
  }

  protected startEditing(purchase: Purchase): void {
    this.resetMessages();
    this.draft = {
      supplierId: purchase.supplierId,
      purchaseDate: purchase.purchaseDate,
      description: purchase.description,
      totalAmount: purchase.totalAmount,
      notes: purchase.notes ?? '',
      productId: purchase.productId,
    };
    this.editingId.set(purchase.id);
    this.creating.set(false);
  }

  protected cancelForm(): void {
    this.creating.set(false);
    this.editingId.set(null);
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.resetMessages();
    try {
      if (this.editingId()) await this.service.update(this.editingId()!, this.draft);
      else await this.service.create(this.draft);
      this.cancelForm();
      this.successMessage.set('Acquisto salvato localmente.');
      await this.loadPurchases();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare l\'acquisto.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(purchase: Purchase): Promise<void> {
    if (!window.confirm(`Eliminare logicamente "${purchase.description}"?`)) return;
    this.resetMessages();
    try {
      await this.service.delete(purchase.id);
      this.successMessage.set('Acquisto eliminato logicamente.');
      await this.loadPurchases();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare l\'acquisto.');
    }
  }

  protected startCreatingLot(purchase: Purchase): void {
    this.resetMessages();
    this.lotListDialogOpen.set(false);
    this.lotPurchaseId.set(purchase.id);
    this.lotEditingId.set(null);
    this.lotDraft = this.emptyLotDraft(purchase.productId ?? '');
    this.lotAliasText = '';
    this.lotDialogOpen.set(true);
  }

  protected openPurchaseLots(purchase: Purchase): void {
    this.resetMessages();
    this.lotPurchaseId.set(purchase.id);
    this.lotListDialogOpen.set(true);
  }

  protected startEditingLot(lot: Lot): void {
    this.resetMessages();
    this.lotListDialogOpen.set(false);
    this.lotPurchaseId.set(lot.purchaseId ?? null);
    this.lotEditingId.set(lot.id);
    this.lotDraft = { name: lot.name, productId: lot.productId, purchaseId: lot.purchaseId, aliases: lot.aliases ?? [], notes: lot.notes ?? '' };
    this.lotAliasText = (lot.aliases ?? []).join(', ');
    this.lotDialogOpen.set(true);
  }

  protected cancelLotForm(): void { this.lotDialogOpen.set(false); this.lotEditingId.set(null); this.lotPurchaseId.set(null); }
  protected closeLotList(): void { this.lotListDialogOpen.set(false); this.lotPurchaseId.set(null); }

  protected async saveLot(): Promise<void> {
    this.saving.set(true);
    this.resetMessages();
    const purchase = this.purchases().find((item) => item.id === this.lotPurchaseId());
    const input = { ...this.lotDraft, purchaseId: this.lotPurchaseId() ?? undefined, productId: this.lotDraft.productId || purchase?.productId || '', aliases: this.parseAliases(this.lotAliasText) };
    try {
      if (this.lotEditingId()) await this.lotService.update(this.lotEditingId()!, input);
      else await this.lotService.create(input);
      this.cancelLotForm();
      this.successMessage.set('Collegamento salvato localmente.');
      await this.loadAll();
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il collegamento.'); }
    finally { this.saving.set(false); }
  }

  protected async removeLot(lot: Lot): Promise<void> {
    if (!window.confirm(`Eliminare logicamente "${lot.name}"?`)) return;
    await this.lotService.delete(lot.id);
    this.lots.set(await this.lotService.list());
  }

  private async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const [purchases, suppliers, lots, products, operations] = await Promise.all([this.service.list(), this.supplierService.list(), this.lotService.list(), this.productService.list(), this.operationService.list()]);
      this.purchases.set(purchases);
      this.suppliers.set(suppliers);
      this.lots.set(lots);
      this.products.set(products);
      this.operations.set(operations);
    } catch {
      this.errorMessage.set('Impossibile caricare gli acquisti.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadPurchases(): Promise<void> {
    this.loading.set(true);
    try {
      this.purchases.set(await this.service.list());
    } finally {
      this.loading.set(false);
    }
  }

  private resetMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private emptyDraft(): PurchaseInput {
    return { supplierId: undefined, purchaseDate: new Date().toISOString().slice(0, 10), description: '', totalAmount: 0, notes: '', productId: undefined };
  }

  private parseAliases(value: string): readonly string[] { return value.split(',').map((alias) => alias.trim()).filter(Boolean); }
  private emptyLotDraft(productId = ''): LotInput { return { name: '', productId, purchaseId: undefined, aliases: [], notes: '' }; }
}