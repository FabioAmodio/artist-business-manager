import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PurchaseService } from '../../application/purchases/purchase.service';
import { SupplierService, type SupplierInput } from '../../application/suppliers/supplier.service';
import type { Party, SupplierType } from '../../domain/models/party';
import type { Purchase } from '../../domain/models/purchase';
import { FormActionsComponent } from '../../shared/components/form-actions.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormActionsComponent, FormsModule, PageHeaderComponent],
  selector: 'app-suppliers-page',
  templateUrl: './suppliers-page.html',
  styleUrl: './suppliers-page.scss',
})
export class SuppliersPage implements OnInit {
  private readonly service = inject(SupplierService);
  private readonly purchaseService = inject(PurchaseService);
  protected readonly suppliers = signal<readonly Party[]>([]);
  protected readonly purchases = signal<readonly Purchase[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly typeFilter = signal<'all' | SupplierType>('all');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected draft: SupplierInput = this.emptyDraft();

  ngOnInit(): void { void this.load(); }

  protected async applyFilters(): Promise<void> { await this.load(); }

  protected visibleSuppliers(): readonly Party[] {
    const type = this.typeFilter();
    return type === 'all' ? this.suppliers() : this.suppliers().filter((supplier) => supplier.supplierType === type);
  }

  protected isSupplierUsed(supplier: Party): boolean { return this.purchases().some((purchase) => purchase.supplierId === supplier.id); }

  protected startCreating(): void {
    this.resetMessages();
    this.draft = this.emptyDraft();
    this.editingId.set(null);
    this.creating.set(true);
  }

  protected startEditing(supplier: Party): void {
    this.resetMessages();
    this.draft = {
      supplierType: supplier.supplierType ?? 'other',
      displayName: supplier.displayName,
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      website: supplier.website ?? '',
      notes: supplier.notes ?? '',
    };
    this.editingId.set(supplier.id);
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
      this.successMessage.set('Fornitore salvato localmente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il fornitore.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(supplier: Party): Promise<void> {
    if (!window.confirm(`Eliminare logicamente "${supplier.displayName}"?`)) return;
    this.resetMessages();
    try {
      await this.service.delete(supplier.id);
      this.successMessage.set('Fornitore eliminato logicamente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare il fornitore.');
    }
  }

  protected supplierTypeLabel(type: SupplierType | undefined): string {
    switch (type) {
      case 'printer': return 'Tipografia';
      case 'publisher': return 'Editore';
      case 'materials': return 'Materiali';
      case 'marketplace': return 'Marketplace';
      default: return 'Altro fornitore';
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [suppliers, purchases] = await Promise.all([this.service.list(this.query()), this.purchaseService.list()]);
      this.suppliers.set(suppliers);
      this.purchases.set(purchases);
    } catch {
      this.errorMessage.set('Impossibile caricare i fornitori.');
    } finally {
      this.loading.set(false);
    }
  }

  private resetMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private emptyDraft(): SupplierInput {
    return { supplierType: 'printer', displayName: '', email: '', phone: '', website: '', notes: '' };
  }
}