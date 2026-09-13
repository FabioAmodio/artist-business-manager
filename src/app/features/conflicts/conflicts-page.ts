import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PersistenceService, type ConflictDetails } from '../../application/persistence/persistence.service';
import type { SyncOperation } from '../../domain/models/sync-operation';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { SwipeRowComponent } from '../../shared/components/swipe-row/swipe-row.component';
import type { SwipeAction } from '../../shared/components/swipe-row/swipe-row.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, PageHeaderComponent, SwipeRowComponent],
  selector: 'app-conflicts-page',
  templateUrl: './conflicts-page.html',
  styleUrl: './conflicts-page.scss',
})
export class ConflictsPage {
  protected readonly persistence = inject(PersistenceService);
  protected readonly selected = signal<ConflictDetails | null>(null);
  protected readonly choices = signal<Record<string, 'local' | 'remote'>>({});
  protected readonly busy = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly openRowId = signal<string | null>(null);

  protected conflicts(): readonly SyncOperation[] {
    return this.persistence.pendingSyncOperations().filter((operation) => operation.status === 'conflict');
  }

  protected entityLabel(operation: SyncOperation): string {
    const record = operation.after ?? operation.before;
    const value = record?.['name'] ?? record?.['displayName'] ?? record?.['code'] ?? record?.['title'] ?? record?.['description'];
    return value ? String(value) : operation.entityId;
  }

  protected collectionLabel(collection: string): string {
    const labels: Record<string, string> = { bundles: 'Bundle', fairEditions: 'Edizione fiera', fairSeries: 'Serie fiere', lots: 'Lotto', operations: 'Operazione', parties: 'Anagrafica', paymentMethods: 'Metodo di pagamento', payments: 'Pagamento', products: 'Prodotto', purchases: 'Acquisto', services: 'Servizio', workflowSettings: 'Impostazioni workflow' };
    return labels[collection] ?? collection;
  }

  protected conflictActions(operation: SyncOperation): SwipeAction[] {
    return [{ key: 'open', icon: '⚖', label: 'Risolvi', kind: 'auto', run: () => void this.openConflict(operation) }];
  }

  protected async openConflict(operation: SyncOperation): Promise<void> {
    this.errorMessage.set('');
    try {
      const details = await this.persistence.getConflictDetails(operation.id);
      this.selected.set(details);
      this.choices.set(Object.fromEntries(details.fields.map((field) => [field.name, 'remote'])));
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile caricare il conflitto.'); }
  }

  protected closeConflict(): void { if (!this.busy()) this.selected.set(null); }
  protected setChoice(field: string, choice: 'local' | 'remote'): void { this.choices.update((current) => ({ ...current, [field]: choice })); }
  protected choice(field: string): 'local' | 'remote' { return this.choices()[field] ?? 'remote'; }
  protected isDeletionConflict(): boolean { const details = this.selected(); return Boolean(details && (details.operation.action === 'delete' || details.localDeleted !== details.remoteDeleted)); }

  protected async resolveFields(): Promise<void> {
    const details = this.selected();
    if (!details) return;
    await this.runResolution(() => this.persistence.resolveConflictFields(details.operation.id, this.choices()));
  }

  protected async resolveDeletion(decision: 'delete' | 'keep'): Promise<void> {
    const details = this.selected();
    if (!details) return;
    await this.runResolution(() => this.persistence.resolveConflictDeletion(details.operation.id, decision));
  }

  protected formatValue(value: unknown): string {
    if (value === undefined) return 'non presente';
    if (value === null) return 'null';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  private async runResolution(action: () => Promise<void>): Promise<void> {
    this.busy.set(true); this.errorMessage.set(''); this.successMessage.set('');
    try { await action(); this.selected.set(null); this.successMessage.set('Conflitto risolto e dati allineati.'); }
    catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile risolvere il conflitto.'); }
    finally { this.busy.set(false); }
  }
}