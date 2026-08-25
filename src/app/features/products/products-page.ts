import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService, type ProductInput } from '../../application/products/product.service';
import type { Product } from '../../domain/models/product';
import { FormActionsComponent } from '../../shared/components/form-actions.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, FormActionsComponent, FormsModule],
  selector: 'app-products-page',
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
})
export class ProductsPage implements OnInit {
  private readonly service = inject(ProductService);
  protected readonly products = signal<readonly Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly activeFilter = signal<'all' | 'active' | 'inactive'>('all');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected draft: ProductInput = this.emptyDraft();
  protected tagText = '';

  ngOnInit(): void { void this.load(); }

  protected async applyFilters(): Promise<void> { await this.load(); }

  protected visibleProducts(): readonly Product[] {
    const active = this.activeFilter();
    return this.products()
      .filter((product) => active === 'all' || product.active === (active === 'active'));
  }

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
      lotId: product.lotId,
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

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.products.set(await this.service.list(this.query()));
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
    return { name: '', description: '', suggestedPrice: undefined, active: true, tags: [], lotId: undefined };
  }
}