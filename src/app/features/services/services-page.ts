import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OperationService } from '../../application/operations/operation.service';
import { ServiceService, type ServiceInput } from '../../application/services/service.service';
import type { Operation } from '../../domain/models/operation';
import type { Service } from '../../domain/models/service';
import { FormActionsComponent } from '../../shared/components/form-actions.component';
import { SwipeRowComponent } from '../../shared/components/swipe-row/swipe-row.component';
import type { SwipeAction } from '../../shared/components/swipe-row/swipe-row.model';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormActionsComponent, FormsModule, SwipeRowComponent],
  selector: 'app-services-page',
  templateUrl: './services-page.html',
  styleUrl: './services-page.scss',
})
export class ServicesPage implements OnInit {
  private readonly confirmation = inject(ConfirmDialogService);
  private readonly service = inject(ServiceService);
  private readonly operationService = inject(OperationService);
  protected readonly services = signal<readonly Service[]>([]);
  protected readonly operations = signal<readonly Operation[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly openRowId = signal<string | null>(null);
  protected draft: ServiceInput = this.emptyDraft();

  protected serviceRightActions(service: Service): SwipeAction[] {
    return [{ key: 'edit', icon: '✎', label: 'Modifica', kind: 'auto', disabled: service.system, run: () => this.startEditing(service) }];
  }

  protected serviceLeftActions(service: Service): SwipeAction[] {
    return [{ key: 'delete', icon: '🗑', label: 'Elimina', variant: 'danger', kind: 'auto', disabled: service.system || this.isServiceUsed(service), run: () => this.remove(service) }];
  }

  ngOnInit(): void { void this.load(); }
  protected isServiceUsed(service: Service): boolean { return this.operations().some((operation) => operation.serviceId === service.id); }
  protected startCreating(): void { this.resetMessages(); this.draft = this.emptyDraft(); this.editingId.set(null); this.creating.set(true); }
  protected startEditing(service: Service): void { this.resetMessages(); this.draft = { code: service.code, description: service.description, active: service.active }; this.editingId.set(service.id); this.creating.set(false); }
  protected cancelForm(): void { this.creating.set(false); this.editingId.set(null); }

  protected async save(): Promise<void> {
    this.saving.set(true); this.resetMessages();
    try {
      if (this.editingId()) await this.service.update(this.editingId()!, this.draft); else await this.service.create(this.draft);
      this.cancelForm(); this.successMessage.set('Servizio salvato localmente.'); await this.load();
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il servizio.'); }
    finally { this.saving.set(false); }
  }

  protected async remove(service: Service): Promise<void> {
    if (!(await this.confirmation.confirm(`Eliminare logicamente "${service.description}"?`))) return;
    this.resetMessages();
    try { await this.service.delete(service.id); this.successMessage.set('Servizio eliminato logicamente.'); await this.load(); }
    catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare il servizio.'); }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try { const [services, operations] = await Promise.all([this.service.list(), this.operationService.list()]); this.services.set(services); this.operations.set(operations); }
    catch { this.errorMessage.set('Impossibile caricare i servizi.'); }
    finally { this.loading.set(false); }
  }

  private resetMessages(): void { this.errorMessage.set(''); this.successMessage.set(''); }
  private emptyDraft(): ServiceInput { return { code: '', description: '', active: true }; }
}