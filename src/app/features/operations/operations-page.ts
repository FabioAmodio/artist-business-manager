import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OperationService, type OperationInput } from '../../application/operations/operation.service';
import { ClientService } from '../../application/clients/client.service';
import { FairService } from '../../application/fairs/fair.service';
import { LotService } from '../../application/lots/lot.service';
import { ProductService } from '../../application/products/product.service';
import type { Lot } from '../../domain/models/lot';
import type { Operation, OperationType } from '../../domain/models/operation';
import type { Party } from '../../domain/models/party';
import type { Product } from '../../domain/models/product';
import type { Fair } from '../../domain/models/fair';
import { FormActionsComponent } from '../../shared/components/form-actions.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormActionsComponent, FormsModule],
  selector: 'app-operations-page',
  templateUrl: './operations-page.html',
  styleUrl: './operations-page.scss',
})
export class OperationsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OperationService);
  private readonly clientService = inject(ClientService);
  private readonly fairService = inject(FairService);
  private readonly lotService = inject(LotService);
  private readonly productService = inject(ProductService);

  protected readonly operations = signal<readonly Operation[]>([]);
  protected readonly parties = signal<readonly Party[]>([]);
  protected readonly fairs = signal<readonly Fair[]>([]);
  protected readonly lots = signal<readonly Lot[]>([]);
  protected readonly products = signal<readonly Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly mode = signal<'fair' | 'backoffice'>('fair');
  protected readonly query = signal('');
  protected readonly typeFilter = signal<OperationType | 'all'>('all');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected draft: OperationInput = this.emptyDraft();
  protected readonly customerMode = signal<'none' | 'soft' | 'existing'>('none');
  private pendingCreateTrigger: string | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const trigger = params.get('create');
      if (!trigger || trigger === this.pendingCreateTrigger) return;
      this.pendingCreateTrigger = trigger;
      if (!this.loading()) this.openTriggeredOperation();
    });
    void this.loadAll().then(() => { if (this.pendingCreateTrigger) this.openTriggeredOperation(); });
  }

  protected async applyFilters(): Promise<void> { await this.loadOperations(); }
  protected typeLabel(type: OperationType): string { return ({ sale: 'Vendita', commission: 'Commissione', sketch: 'Sketch', other: 'Altro' } as Record<string, string>)[type] ?? type; }
  protected customerLabel(operation: Operation): string { return operation.partyId ? this.partyName(operation.partyId) : (operation.customerName || 'Cliente non indicato'); }
  protected partyName(id?: string): string { return this.parties().find((party) => party.id === id)?.displayName ?? 'Cliente non trovato'; }
  protected fairName(id?: string): string { const fair = this.fairs().find((item) => item.id === id); return fair ? `${fair.name} · ${fair.edition || fair.year}` : 'Fiera non indicata'; }
  protected productName(id?: string): string { return this.products().find((product) => product.id === id)?.name ?? 'Prodotto non indicato'; }
  protected lotName(id?: string): string { return this.lots().find((lot) => lot.id === id)?.name ?? 'Lotto non assegnato'; }
  protected hasWork(operation: Operation): boolean { return operation.type === 'commission' || operation.type === 'sketch' || Boolean(operation.workStatus); }
  protected hasSale(operation: Operation): boolean { return operation.type === 'sale' || Boolean(operation.saleStatus) || typeof operation.amount === 'number'; }
  protected activeFair(): Fair | null { const today = new Date().toISOString().slice(0, 10); return this.fairs().find((fair) => fair.startDate <= today && today <= fair.endDate) ?? null; }
  protected fairProductChoices(): readonly Product[] {
    const concludedFairIds = this.fairs()
      .filter((fair) => fair.endDate < new Date().toISOString().slice(0, 10))
      .sort((first, second) => second.endDate.localeCompare(first.endDate))
      .slice(0, 10)
      .map((fair) => fair.id);
    const usage = new Map<string, number>();
    for (const operation of this.operations()) {
      if (operation.productId && operation.fairEditionId && concludedFairIds.includes(operation.fairEditionId)) usage.set(operation.productId, (usage.get(operation.productId) ?? 0) + 1);
    }
    return this.products()
      .filter((product) => product.active)
      .sort((first, second) => (usage.get(second.id) ?? 0) - (usage.get(first.id) ?? 0) || first.name.localeCompare(second.name));
  }

  protected setMode(mode: 'fair' | 'backoffice'): void { this.mode.set(mode); this.cancelForm(); }
  protected openFairWizard(): void { this.startCreating('sale'); }
  protected selectingFairProduct(): boolean { return this.mode() === 'fair' && this.creating() && !this.draft.productId; }
  protected selectQuickProduct(product: Product): void {
    if (!this.creating()) this.startCreating('sale');
    this.draft = { ...this.draft, productId: product.id, title: product.name, amount: product.suggestedPrice };
  }
  protected clearSelectedProduct(): void { this.draft = { ...this.draft, productId: undefined, title: '', amount: undefined }; }
  protected updateCustomerName(value: string): void {
    this.draft = { ...this.draft, customerName: value, partyId: undefined };
    this.customerMode.set(value.trim() ? 'soft' : 'none');
  }
  protected customerSuggestions(): readonly Party[] {
    const normalized = this.draft.customerName?.trim().toLowerCase() ?? '';
    if (normalized.length < 2 || this.customerMode() === 'existing') return [];
    return this.parties()
      .filter((party) => party.displayName.toLowerCase().includes(normalized))
      .slice(0, 3);
  }
  protected selectCustomerSuggestion(party: Party): void {
    this.draft = { ...this.draft, partyId: party.id, customerName: party.displayName };
    this.customerMode.set('existing');
  }
  protected continueWithSoftCustomer(): void {
    this.draft = { ...this.draft, partyId: undefined };
    this.customerMode.set(this.draft.customerName?.trim() ? 'soft' : 'none');
  }
  protected startCreating(type: OperationType = 'sale'): void {
    this.resetMessages();
    this.customerMode.set('none');
    this.draft = this.emptyDraft(type);
    this.editingId.set(null);
    this.creating.set(true);
  }
  protected startEditing(operation: Operation): void {
    this.resetMessages();
    this.customerMode.set(operation.partyId ? 'existing' : (operation.customerName ? 'soft' : 'none'));
    this.draft = { ...this.emptyDraft(operation.type), ...operation };
    this.editingId.set(operation.id);
    this.creating.set(false);
    this.mode.set('backoffice');
  }
  protected cancelForm(): void { this.creating.set(false); this.editingId.set(null); }

  protected async save(): Promise<void> {
    this.saving.set(true); this.resetMessages();
    const input = this.prepareInput();
    try {
      if (this.editingId()) await this.service.update(this.editingId()!, input);
      else await this.service.create(input);
      this.cancelForm(); this.successMessage.set('Operazione salvata localmente.'); await this.loadOperations();
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare l\'operazione.'); }
    finally { this.saving.set(false); }
  }

  protected async remove(operation: Operation): Promise<void> {
    if (!window.confirm(`Eliminare logicamente "${operation.title}"?`)) return;
    this.resetMessages();
    try { await this.service.delete(operation.id); this.successMessage.set('Operazione eliminata logicamente.'); await this.loadOperations(); }
    catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare l\'operazione.'); }
  }

  private async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const [operations, parties, fairs, lots, products] = await Promise.all([this.service.list(), this.clientService.list(), this.fairService.list(), this.lotService.list(), this.productService.list()]);
      this.operations.set(operations); this.parties.set(parties); this.fairs.set(fairs); this.lots.set(lots); this.products.set(products);
    } catch { this.errorMessage.set('Impossibile caricare le operazioni.'); }
    finally { this.loading.set(false); }
  }

  private async loadOperations(): Promise<void> { this.loading.set(true); try { this.operations.set(await this.service.list(this.typeFilter(), this.query())); } finally { this.loading.set(false); } }
  private resetMessages(): void { this.errorMessage.set(''); this.successMessage.set(''); }
  private openTriggeredOperation(): void {
    this.mode.set('fair');
    this.openFairWizard();
  }
  private prepareInput(): OperationInput {
    const product = this.products().find((item) => item.id === this.draft.productId);
    const title = this.draft.title.trim() || product?.name || this.draft.description?.trim() || 'Operazione fiera';
    const fairEditionId = this.mode() === 'fair' ? (this.activeFair()?.id ?? this.draft.fairEditionId) : this.draft.fairEditionId;
    const partyId = this.customerMode() === 'existing' ? this.draft.partyId : undefined;
    const customerName = this.customerMode() === 'soft' ? this.draft.customerName?.trim() : undefined;
    return { ...this.draft, title, fairEditionId, partyId, customerName, lotId: this.mode() === 'fair' ? undefined : this.draft.lotId, type: this.draft.type || 'sale', saleStatus: this.draft.saleStatus ?? 'draft', needsReview: this.draft.needsReview ?? false };
  }
  private emptyDraft(type: OperationType = 'commission'): OperationInput {
    return { type, title: '', description: '', partyId: undefined, fairEditionId: this.mode() === 'fair' ? this.activeFair()?.id : undefined, productId: undefined, lotId: undefined, customerName: '', amount: undefined, notes: '', workStatus: type === 'sale' ? undefined : 'draft', saleStatus: type === 'sale' ? 'draft' : undefined, economicStatus: undefined, needsReview: false };
  }
}
