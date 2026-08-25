import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PurchaseService, type PurchaseInput } from '../../application/purchases/purchase.service';
import { SupplierService } from '../../application/suppliers/supplier.service';
import type { Party } from '../../domain/models/party';
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
  private readonly supplierService = inject(SupplierService);
  protected readonly purchases = signal<readonly Purchase[]>([]);
  protected readonly suppliers = signal<readonly Party[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected draft: PurchaseInput = this.emptyDraft();

  ngOnInit(): void { void this.loadAll(); }

  protected visiblePurchases(): readonly Purchase[] {
    const normalized = this.query().trim().toLowerCase();
    if (!normalized) return this.purchases();
    return this.purchases().filter((purchase) => `${purchase.purchaseDate} ${purchase.description} ${purchase.notes ?? ''} ${purchase.totalAmount} ${this.supplierName(purchase.supplierId)}`.toLowerCase().includes(normalized));
  }

  protected supplierName(id?: string): string {
    return this.suppliers().find((supplier) => supplier.id === id)?.displayName ?? 'Fornitore non indicato';
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
      lotId: purchase.lotId,
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

  private async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const [purchases, suppliers] = await Promise.all([this.service.list(), this.supplierService.list()]);
      this.purchases.set(purchases);
      this.suppliers.set(suppliers);
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
    return { supplierId: undefined, purchaseDate: new Date().toISOString().slice(0, 10), description: '', totalAmount: 0, notes: '', productId: undefined, lotId: undefined };
  }
}