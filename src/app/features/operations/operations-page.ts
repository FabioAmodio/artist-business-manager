import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OperationService, type OperationInput } from '../../application/operations/operation.service';
import { ClientService } from '../../application/clients/client.service';
import { FairService } from '../../application/fairs/fair.service';
import type { Operation, OperationType } from '../../domain/models/operation';
import type { Party } from '../../domain/models/party';
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
  private readonly service = inject(OperationService);
  private readonly clientService = inject(ClientService);
  private readonly fairService = inject(FairService);

  protected readonly operations = signal<readonly Operation[]>([]);
  protected readonly parties = signal<readonly Party[]>([]);
  protected readonly fairs = signal<readonly Fair[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly typeFilter = signal<OperationType | 'all'>('all');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected draft: OperationInput = this.emptyDraft();

  ngOnInit(): void { void this.loadAll(); }

  protected async applyFilters(): Promise<void> { await this.loadOperations(); }
  protected typeLabel(type: OperationType): string { return ({ sale: 'Vendita', commission: 'Commissione', sketch: 'Sketch', other: 'Altro' } as Record<string, string>)[type] ?? type; }
  protected partyName(id?: string): string { return this.parties().find((party) => party.id === id)?.displayName ?? 'Cliente non indicato'; }
  protected fairName(id?: string): string { const fair = this.fairs().find((item) => item.id === id); return fair ? `${fair.name} · ${fair.edition || fair.year}` : 'Fiera non indicata'; }
  protected hasWork(operation: Operation): boolean { return operation.type === 'commission' || operation.type === 'sketch' || Boolean(operation.workStatus); }
  protected hasSale(operation: Operation): boolean { return operation.type === 'sale' || Boolean(operation.saleStatus) || typeof operation.amount === 'number'; }

  protected startCreating(type: OperationType = 'commission'): void { this.resetMessages(); this.draft = this.emptyDraft(type); this.editingId.set(null); this.creating.set(true); }
  protected startEditing(operation: Operation): void { this.resetMessages(); this.draft = { ...this.emptyDraft(operation.type), ...operation }; this.editingId.set(operation.id); this.creating.set(false); }
  protected cancelForm(): void { this.creating.set(false); this.editingId.set(null); }

  protected async save(): Promise<void> {
    this.saving.set(true); this.resetMessages();
    try {
      if (this.editingId()) await this.service.update(this.editingId()!, this.draft);
      else await this.service.create(this.draft);
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
      const [operations, parties, fairs] = await Promise.all([this.service.list(), this.clientService.list(), this.fairService.list()]);
      this.operations.set(operations); this.parties.set(parties); this.fairs.set(fairs);
    } catch { this.errorMessage.set('Impossibile caricare le operazioni.'); }
    finally { this.loading.set(false); }
  }

  private async loadOperations(): Promise<void> { this.loading.set(true); try { this.operations.set(await this.service.list(this.typeFilter(), this.query())); } finally { this.loading.set(false); } }
  private resetMessages(): void { this.errorMessage.set(''); this.successMessage.set(''); }
  private emptyDraft(type: OperationType = 'commission'): OperationInput {
    return { type, title: '', description: '', partyId: undefined, fairEditionId: undefined, amount: undefined, workStatus: type === 'sale' ? undefined : 'draft', saleStatus: type === 'sale' ? 'draft' : undefined, economicStatus: undefined, needsReview: false };
  }
}
