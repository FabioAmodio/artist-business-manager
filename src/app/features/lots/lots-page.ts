import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LotService, type LotInput } from '../../application/lots/lot.service';
import { ProductService } from '../../application/products/product.service';
import { OperationService } from '../../application/operations/operation.service';
import { PurchaseService } from '../../application/purchases/purchase.service';
import type { Lot } from '../../domain/models/lot';
import type { Product } from '../../domain/models/product';
import type { Purchase } from '../../domain/models/purchase';
import { FormActionsComponent } from '../../shared/components/form-actions.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormActionsComponent, FormsModule],
  selector: 'app-lots-page',
  templateUrl: './lots-page.html',
  styleUrl: './lots-page.scss',
})
export class LotsPage implements OnInit {
  private readonly service = inject(LotService);
  private readonly operationService = inject(OperationService);
  private readonly productService = inject(ProductService);
  private readonly purchaseService = inject(PurchaseService);
  protected readonly lots = signal<readonly Lot[]>([]);
  protected readonly operations = signal<readonly import('../../domain/models/operation').Operation[]>([]);
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
  protected aliasText = '';

  ngOnInit(): void { void this.loadAll(); }

  protected visibleLots(): readonly Lot[] {
    const normalized = this.query().trim().toLowerCase();
    if (!normalized) return this.lots();
    return this.lots().filter((lot) => `${lot.name} ${this.productName(lot.productId)} ${this.purchaseLabel(lot.purchaseId)} ${(lot.aliases ?? []).join(' ')} ${lot.notes ?? ''}`.toLowerCase().includes(normalized));
  }

  protected productName(id: string): string {
    return this.products().find((product) => product.id === id)?.name ?? 'Prodotto non trovato';
  }

  protected purchaseLabel(id?: string): string {
    const purchase = this.purchases().find((item) => item.id === id);
    return purchase ? `${purchase.purchaseDate} · ${purchase.description}` : 'Acquisto non indicato';
  }
  protected isLotUsed(lot: Lot): boolean { return this.operations().some((operation) => operation.lotId === lot.id); }

  protected startCreating(): void {
    this.resetMessages();
    this.draft = this.emptyDraft();
    this.aliasText = '';
    this.editingId.set(null);
    this.creating.set(true);
  }

  protected startEditing(lot: Lot): void {
    this.resetMessages();
    this.draft = {
      name: lot.name,
      productId: lot.productId,
      purchaseId: lot.purchaseId,
      aliases: lot.aliases ?? [],
      notes: lot.notes ?? '',
    };
    this.aliasText = (lot.aliases ?? []).join(', ');
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
    const input = { ...this.draft, aliases: this.parseAliases(this.aliasText) };
    try {
      if (this.editingId()) await this.service.update(this.editingId()!, input);
      else await this.service.create(input);
      this.cancelForm();
      this.successMessage.set('Collegamento salvato localmente.');
      await this.loadLots();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il collegamento.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(lot: Lot): Promise<void> {
    if (!window.confirm(`Eliminare logicamente "${lot.name}"?`)) return;
    this.resetMessages();
    try {
      await this.service.delete(lot.id);
      this.successMessage.set('Collegamento eliminato logicamente.');
      await this.loadLots();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare il collegamento.');
    }
  }

  private async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const [lots, products, purchases, operations] = await Promise.all([this.service.list(), this.productService.list(), this.purchaseService.list(), this.operationService.list()]);
      this.lots.set(lots);
      this.products.set(products);
      this.purchases.set(purchases);
      this.operations.set(operations);
    } catch {
      this.errorMessage.set('Impossibile caricare i collegamenti.');
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

  private parseAliases(value: string): readonly string[] {
    return value.split(',').map((alias) => alias.trim()).filter(Boolean);
  }

  private emptyDraft(): LotInput {
    return { name: '', productId: '', purchaseId: undefined, aliases: [], notes: '' };
  }
}