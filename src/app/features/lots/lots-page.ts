import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LotService, type LotInput } from '../../application/lots/lot.service';
import { ProductService } from '../../application/products/product.service';
import { PurchaseService } from '../../application/purchases/purchase.service';
import type { Lot } from '../../domain/models/lot';
import type { Product } from '../../domain/models/product';
import type { Purchase } from '../../domain/models/purchase';
import { FormActionsComponent } from '../../shared/components/form-actions.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, FormActionsComponent, FormsModule],
  selector: 'app-lots-page',
  templateUrl: './lots-page.html',
  styleUrl: './lots-page.scss',
})
export class LotsPage implements OnInit {
  private readonly service = inject(LotService);
  private readonly productService = inject(ProductService);
  private readonly purchaseService = inject(PurchaseService);
  protected readonly lots = signal<readonly Lot[]>([]);
  protected readonly products = signal<readonly Product[]>([]);
  protected readonly purchases = signal<readonly Purchase[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected draft: LotInput = this.emptyDraft();

  ngOnInit(): void { void this.loadAll(); }

  protected visibleLots(): readonly Lot[] {
    const normalized = this.query().trim().toLowerCase();
    if (!normalized) return this.lots();
    return this.lots().filter((lot) => `${lot.name} ${this.productName(lot.productId)} ${this.purchaseLabel(lot.purchaseId)} ${lot.notes ?? ''}`.toLowerCase().includes(normalized));
  }

  protected productName(id: string): string {
    return this.products().find((product) => product.id === id)?.name ?? 'Prodotto non trovato';
  }

  protected purchaseLabel(id?: string): string {
    const purchase = this.purchases().find((item) => item.id === id);
    return purchase ? `${purchase.purchaseDate} · ${purchase.description}` : 'Acquisto non indicato';
  }

  protected availabilityLabel(lot: Lot): string {
    if (lot.remainingQuantity == null || lot.initialQuantity == null) return 'n.d.';
    return `${lot.remainingQuantity} / ${lot.initialQuantity}`;
  }

  protected startCreating(): void {
    this.resetMessages();
    this.draft = this.emptyDraft();
    this.editingId.set(null);
    this.creating.set(true);
  }

  protected startEditing(lot: Lot): void {
    this.resetMessages();
    this.draft = {
      name: lot.name,
      productId: lot.productId,
      purchaseId: lot.purchaseId,
      lotDate: lot.lotDate ?? '',
      initialQuantity: lot.initialQuantity,
      remainingQuantity: lot.remainingQuantity,
      totalCost: lot.totalCost,
      notes: lot.notes ?? '',
    };
    this.editingId.set(lot.id);
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
      this.successMessage.set('Lotto salvato localmente.');
      await this.loadLots();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il lotto.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(lot: Lot): Promise<void> {
    if (!window.confirm(`Eliminare logicamente "${lot.name}"?`)) return;
    this.resetMessages();
    try {
      await this.service.delete(lot.id);
      this.successMessage.set('Lotto eliminato logicamente.');
      await this.loadLots();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare il lotto.');
    }
  }

  private async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const [lots, products, purchases] = await Promise.all([this.service.list(), this.productService.list(), this.purchaseService.list()]);
      this.lots.set(lots);
      this.products.set(products);
      this.purchases.set(purchases);
    } catch {
      this.errorMessage.set('Impossibile caricare i lotti.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadLots(): Promise<void> {
    this.loading.set(true);
    try {
      this.lots.set(await this.service.list());
    } finally {
      this.loading.set(false);
    }
  }

  private resetMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private emptyDraft(): LotInput {
    return { name: '', productId: '', purchaseId: undefined, lotDate: new Date().toISOString().slice(0, 10), initialQuantity: undefined, remainingQuantity: undefined, totalCost: undefined, notes: '' };
  }
}