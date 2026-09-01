import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OperationService } from '../../application/operations/operation.service';
import { PaymentService } from '../../application/payments/payment.service';
import { PaymentMethodService, type PaymentMethodInput } from '../../application/payment-methods/payment-method.service';
import type { Payment } from '../../domain/models/payment';
import type { PaymentMethod } from '../../domain/models/payment-method';
import { FormActionsComponent } from '../../shared/components/form-actions.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormActionsComponent, FormsModule, PageHeaderComponent],
  selector: 'app-payment-methods-page',
  templateUrl: './payment-methods-page.html',
  styleUrl: './payment-methods-page.scss',
})
export class PaymentMethodsPage implements OnInit {
  private readonly service = inject(PaymentMethodService);
  private readonly paymentService = inject(PaymentService);
  protected readonly paymentMethods = signal<readonly PaymentMethod[]>([]);
  protected readonly payments = signal<readonly Payment[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected draft: PaymentMethodInput = this.emptyDraft();

  ngOnInit(): void { void this.load(); }

  protected isPaymentMethodUsed(paymentMethod: PaymentMethod): boolean {
    return this.payments().some((payment) => payment.paymentMethodId === paymentMethod.id);
  }

  protected startCreating(): void {
    this.resetMessages();
    this.draft = this.emptyDraft();
    this.editingId.set(null);
    this.creating.set(true);
  }

  protected startEditing(paymentMethod: PaymentMethod): void {
    this.resetMessages();
    this.draft = { name: paymentMethod.name };
    this.editingId.set(paymentMethod.id);
    this.creating.set(false);
  }

  protected cancelForm(): void { this.creating.set(false); this.editingId.set(null); }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.resetMessages();
    try {
      if (this.editingId()) await this.service.update(this.editingId()!, this.draft);
      else await this.service.create(this.draft);
      this.cancelForm();
      this.successMessage.set('Modalita di pagamento salvata localmente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare la modalita di pagamento.');
    } finally { this.saving.set(false); }
  }

  protected async remove(paymentMethod: PaymentMethod): Promise<void> {
    if (!window.confirm(`Eliminare logicamente "${paymentMethod.name}"?`)) return;
    this.resetMessages();
    try {
      await this.service.delete(paymentMethod.id);
      this.successMessage.set('Modalita di pagamento eliminata logicamente.');
      await this.load();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare la modalita di pagamento.');
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [paymentMethods, payments] = await Promise.all([this.service.list(), this.paymentService.list()]);
      this.paymentMethods.set(paymentMethods);
      this.payments.set(payments);
    } catch { this.errorMessage.set('Impossibile caricare le modalita di pagamento.'); }
    finally { this.loading.set(false); }
  }

  private resetMessages(): void { this.errorMessage.set(''); this.successMessage.set(''); }
  private emptyDraft(): PaymentMethodInput { return { name: '' }; }
}