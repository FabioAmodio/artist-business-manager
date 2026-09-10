import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, type ClientInput } from '../../application/clients/client.service';
import { OperationService } from '../../application/operations/operation.service';
import type { Operation } from '../../domain/models/operation';
import type { Party } from '../../domain/models/party';
import { FormActionsComponent } from '../../shared/components/form-actions.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { ListFilterPanelComponent } from '../../shared/components/list-filter-panel.component';
import { NumberStepperComponent } from '../../shared/components/number-stepper.component';
import { SwipeRowComponent } from '../../shared/components/swipe-row/swipe-row.component';
import type { SwipeAction } from '../../shared/components/swipe-row/swipe-row.model';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog.service';

type ClientSortKey = 'name' | 'purchases' | 'spending';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, FormActionsComponent, FormsModule, ListFilterPanelComponent, NumberStepperComponent, PageHeaderComponent, SwipeRowComponent],
  selector: 'app-clients-page',
  templateUrl: './clients-page.html',
  styleUrl: './clients-page.scss',
})
export class ClientsPage implements OnInit {
  private readonly confirmation = inject(ConfirmDialogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ClientService);
  private readonly operationService = inject(OperationService);
  protected readonly clients = signal<readonly Party[]>([]);
  protected readonly operations = signal<readonly Operation[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly typeFilter = signal<'all' | 'person' | 'organization'>('all');
  protected readonly purchasesMin = signal<number | null>(null);
  protected readonly purchasesMax = signal<number | null>(null);
  protected readonly spendingMin = signal<number | null>(null);
  protected readonly spendingMax = signal<number | null>(null);
  protected readonly filtersOpen = signal(false);
  protected readonly sortOpen = signal(false);
  protected readonly openRowId = signal<string | null>(null);

  protected clientRightActions(client: Party): SwipeAction[] {
    return [{ key: 'edit', icon: '✎', label: 'Modifica', kind: 'auto', run: () => this.startEditing(client) }];
  }

  protected clientLeftActions(client: Party): SwipeAction[] {
    return [{ key: 'delete', icon: '🗑', label: 'Elimina', variant: 'danger', kind: 'auto', disabled: this.isClientUsed(client), run: () => this.remove(client) }];
  }
  protected readonly sortKey = signal<ClientSortKey>('name');
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected draft: ClientInput = this.emptyDraft();
  private returnOperationId: string | null = null;
  private returnPath = '/sales';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('create') !== 'quick') return;
      this.returnOperationId = params.get('returnOperationId');
      this.returnPath = params.get('returnPath') || '/sales';
      this.startCreating(params.get('name') || '');
    });
    void this.load();
  }

  protected async applyFilters(): Promise<void> { await this.load(); }

  protected visibleClients(): readonly Party[] {
    const type = this.typeFilter();
    let clients = type === 'all' ? this.clients() : this.clients().filter((client) => client.type === type);
    if (this.purchasesMin() !== null) clients = clients.filter((client) => this.purchaseCount(client) >= this.purchasesMin()!);
    if (this.purchasesMax() !== null) clients = clients.filter((client) => this.purchaseCount(client) <= this.purchasesMax()!);
    if (this.spendingMin() !== null) clients = clients.filter((client) => this.purchaseTotal(client) >= this.spendingMin()!);
    if (this.spendingMax() !== null) clients = clients.filter((client) => this.purchaseTotal(client) <= this.spendingMax()!);
    return [...clients].sort((first, second) => this.compareClients(first, second));
  }
  protected hasActiveFilters(): boolean { return Boolean(this.query().trim()) || this.typeFilter() !== 'all' || this.purchasesMin() !== null || this.purchasesMax() !== null || this.spendingMin() !== null || this.spendingMax() !== null; }
  protected closeFilterPanel(): void { this.filtersOpen.set(false); }
  protected resetFilters(): void { this.query.set(''); this.typeFilter.set('all'); this.purchasesMin.set(null); this.purchasesMax.set(null); this.spendingMin.set(null); this.spendingMax.set(null); this.filtersOpen.set(false); void this.load(); }
  protected hasActiveSort(): boolean { return this.sortKey() !== 'name' || this.sortDirection() !== 'asc'; }
  protected toggleSort(): void { this.sortOpen.update((open) => !open); this.filtersOpen.set(false); }
  protected restoreSort(): void { this.sortKey.set('name'); this.sortDirection.set('asc'); this.sortOpen.set(false); }
  protected changeSortDirection(): void { this.sortDirection.update((direction) => direction === 'asc' ? 'desc' : 'asc'); }
  @HostListener('document:click', ['$event'])
  protected closeSortOutside(event: MouseEvent): void { const target = event.target; if (this.sortOpen() && (!(target instanceof Element) || (!target.closest('.sort-panel') && !target.closest('.sort-toggle')))) this.sortOpen.set(false); }
  private compareClients(first: Party, second: Party): number {
    const value = (client: Party): string | number => this.sortKey() === 'name' ? client.displayName.toLocaleLowerCase() : this.sortKey() === 'purchases' ? this.purchaseCount(client) : this.purchaseTotal(client);
    const firstValue = value(first); const secondValue = value(second);
    const result = typeof firstValue === 'number' && typeof secondValue === 'number' ? firstValue - secondValue : String(firstValue).localeCompare(String(secondValue), 'it', { numeric: true, sensitivity: 'base' });
    return this.sortDirection() === 'asc' ? result : -result;
  }

  protected isClientUsed(client: Party): boolean { return this.operations().some((operation) => operation.partyId === client.id); }
  protected purchaseCount(client: Party): number { return this.operations().filter((operation) => !operation.parentOperationId && operation.partyId === client.id && (operation.type === 'sale' || operation.type === 'bundle')).length; }
  protected purchaseTotal(client: Party): number { return this.operations().filter((operation) => !operation.parentOperationId && operation.partyId === client.id && (operation.type === 'sale' || operation.type === 'bundle')).reduce((total, operation) => total + (operation.amount ?? 0), 0); }
  protected openClientSales(client: Party): void { void this.router.navigate(['/sales'], { queryParams: { customer: client.id } }); }

  protected startCreating(displayName = ''): void {
    this.resetMessages();
    this.draft = { ...this.emptyDraft(), displayName };
    this.editingId.set(null);
    this.creating.set(true);
  }

  protected startEditing(client: Party): void {
    this.resetMessages();
    this.draft = {
      type: client.type,
      displayName: client.displayName,
      email: client.email ?? '',
      phone: client.phone ?? '',
      website: client.website ?? '',
      social: client.social ?? '',
      notes: client.notes ?? '',
    };
    this.editingId.set(client.id);
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
      const client = this.editingId() ? await this.service.update(this.editingId()!, this.draft) : await this.service.create(this.draft);
      if (this.returnOperationId) {
        await this.assignClientToOperationTree(this.returnOperationId, client.id, client.displayName);
        await this.router.navigate([this.returnPath], { queryParams: { open: this.returnOperationId } });
        return;
      }
      this.cancelForm();
      this.successMessage.set('Cliente salvato localmente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il cliente.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(client: Party): Promise<void> {
    if (!(await this.confirmation.confirm(`Eliminare logicamente "${client.displayName}"?`))) return;
    this.resetMessages();
    try {
      await this.service.delete(client.id);
      this.successMessage.set('Cliente eliminato logicamente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare il cliente.');
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [clients, operations] = await Promise.all([this.service.list(this.query()), this.operationService.list()]);
      this.clients.set(clients);
      this.operations.set(operations);
    } catch {
      this.errorMessage.set('Impossibile caricare i clienti.');
    } finally {
      this.loading.set(false);
    }
  }

  private resetMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private emptyDraft(): ClientInput {
    return { type: 'person', displayName: '', email: '', phone: '', website: '', social: '', notes: '' };
  }

  private async assignClientToOperationTree(operationId: string, clientId: string, customerName: string): Promise<void> {
    const operations = await this.operationService.list('all');
    const targetIds = new Set([operationId, ...operations.filter((operation) => operation.parentOperationId === operationId).map((operation) => operation.id)]);
    for (const operation of operations.filter((item) => targetIds.has(item.id))) {
      await this.operationService.update(operation.id, {
        type: operation.type,
        title: operation.title,
        description: operation.description,
        partyId: clientId,
        fairEditionId: operation.fairEditionId,
        productId: operation.productId,
        serviceId: operation.serviceId,
        bundleId: operation.bundleId,
        parentOperationId: operation.parentOperationId,
        lotId: operation.lotId,
        customerName,
        amount: operation.amount,
        quantity: operation.quantity,
        notes: operation.notes,
        workStatus: operation.workStatus,
        deliveryDate: operation.deliveryDate,
        needsReview: operation.needsReview,
      });
    }
  }
}
