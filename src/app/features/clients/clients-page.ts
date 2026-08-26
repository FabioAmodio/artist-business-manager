import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClientService, type ClientInput } from '../../application/clients/client.service';
import { OperationService } from '../../application/operations/operation.service';
import type { Operation } from '../../domain/models/operation';
import type { Party } from '../../domain/models/party';
import { FormActionsComponent } from '../../shared/components/form-actions.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormActionsComponent, FormsModule],
  selector: 'app-clients-page',
  templateUrl: './clients-page.html',
  styleUrl: './clients-page.scss',
})
export class ClientsPage implements OnInit {
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
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected draft: ClientInput = this.emptyDraft();

  ngOnInit(): void { void this.load(); }

  protected async applyFilters(): Promise<void> { await this.load(); }

  protected visibleClients(): readonly Party[] {
    const type = this.typeFilter();
    return type === 'all' ? this.clients() : this.clients().filter((client) => client.type === type);
  }

  protected isClientUsed(client: Party): boolean { return this.operations().some((operation) => operation.partyId === client.id); }

  protected startCreating(): void {
    this.resetMessages();
    this.draft = this.emptyDraft();
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
      if (this.editingId()) await this.service.update(this.editingId()!, this.draft);
      else await this.service.create(this.draft);
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
    if (!window.confirm(`Eliminare logicamente "${client.displayName}"?`)) return;
    this.resetMessages();
    try {
      await this.service.delete(client.id);
      this.successMessage.set('Cliente eliminato logicamente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare il cliente.');
    }
  }

  protected typeLabel(type: Party['type']): string {
    return type === 'person' ? 'Persona' : 'Organizzazione';
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
}
