import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FairService, type FairInput } from '../../application/fairs/fair.service';
import { FairValidationError } from '../../application/fairs/fair.service';
import type { FairValidationIssue } from '../../domain/rules/fair-validation';
import type { Fair } from '../../domain/models/fair';
import type { FairSeries } from '../../domain/models/fair';
import { FormActionsComponent } from '../../shared/components/form-actions.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormActionsComponent, FormsModule],
  selector: 'app-fairs-page',
  templateUrl: './fairs-page.html',
  styleUrl: './fairs-page.scss',
})
export class FairsPage implements OnInit {
  private readonly service = inject(FairService);
  protected readonly fairs = signal<readonly Fair[]>([]);
  protected readonly series = signal<readonly FairSeries[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly validationIssues = signal<readonly FairValidationIssue[]>([]);
  protected readonly matchedSeries = signal<FairSeries | null>(null);
  protected draft: FairInput = this.emptyDraft();

  ngOnInit(): void { void this.load(); void this.loadSeries(); }

  protected startCreating(): void {
    this.resetMessages();
    this.draft = this.emptyDraft();
    this.matchedSeries.set(null);
    this.warningsAcknowledged = false;
    this.creating.set(true);
  }

  protected startEditing(fair: Fair): void {
    this.resetMessages();
    this.draft = { ...this.emptyDraft(), ...fair, edition: fair.edition || String(fair.year ?? ''), fairSeriesId: fair.fairSeriesId };
    this.matchedSeries.set(null);
    this.warningsAcknowledged = false;
    this.editingId.set(fair.id);
  }

  protected cancelForm(): void { this.creating.set(false); this.editingId.set(null); this.warningsAcknowledged = false; this.validationIssues.set([]); }

  protected onFairNameChange(name: string): void {
    const match = this.series().find((series) => series.name.toLowerCase() === name.trim().toLowerCase());
    this.matchedSeries.set(match ?? null);
  }

  protected useExistingSeries(series: FairSeries): void {
    this.draft = { ...this.draft, fairSeriesId: series.id, location: this.draft.location || series.defaultLocation || '' };
    this.matchedSeries.set(null);
  }

  protected useNewSeries(): void {
    this.draft = { ...this.draft, fairSeriesId: undefined };
    this.matchedSeries.set(null);
  }

  protected async save(): Promise<void> {
    this.saving.set(true); this.resetMessages();
    try {
      const issues = await this.service.validate(this.draft, this.editingId() ?? undefined);
      this.validationIssues.set(issues);
      const errors = issues.filter((issue) => issue.severity === 'ERROR');
      const warnings = issues.filter((issue) => issue.severity === 'WARNING');
      if (errors.length) return;
      if (warnings.length && !this.warningsAcknowledged) {
        this.warningsAcknowledged = true;
        return;
      }
      if (this.editingId()) await this.service.update(this.editingId()!, this.draft, true);
      else await this.service.create(this.draft, true);
      this.validationIssues.set([]);
      this.cancelForm(); this.successMessage.set('Fiera salvata localmente.'); await this.load(); await this.loadSeries();
    } catch (error) { if (error instanceof FairValidationError) this.validationIssues.set(error.issues); else this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare la fiera.'); }
    finally { this.saving.set(false); }
  }

  protected async remove(fair: Fair): Promise<void> {
    if (!window.confirm(`Eliminare logicamente la fiera "${fair.name}"?`)) return;
    this.resetMessages();
    try { await this.service.delete(fair.id); this.successMessage.set('Fiera eliminata logicamente.'); await this.load(); }
    catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare la fiera.'); }
  }

  private async load(): Promise<void> { this.loading.set(true); try { this.fairs.set(await this.service.list()); } catch { this.errorMessage.set('Impossibile caricare le fiere.'); } finally { this.loading.set(false); } }
  private async loadSeries(): Promise<void> { try { this.series.set(await this.service.listSeries()); } catch { this.errorMessage.set('Impossibile caricare le serie di fiere.'); } }
  private resetMessages(): void { this.errorMessage.set(''); this.successMessage.set(''); }
  private warningsAcknowledged = false;
  protected hasWarnings(): boolean { return this.validationIssues().some((issue) => issue.severity === 'WARNING'); }
  protected hasFieldError(field: string): boolean { return this.validationIssues().some((issue) => issue.severity === 'ERROR' && issue.fields?.includes(field)); }

  protected totalCosts(fair: Fair): number | undefined {
    const values = [fair.standCost, fair.hotelCost, fair.travelCost, fair.otherCosts]
      .map((value) => this.amountValue(value))
      .filter((value): value is number => typeof value === 'number');
    return values.length ? values.reduce((sum, value) => sum + value, 0) : undefined;
  }

  protected fairBalance(fair: Fair): number | undefined {
    const total = this.totalCosts(fair);
    const reimbursement = this.amountValue(fair.reimbursement);
    if (typeof total !== 'number' && typeof reimbursement !== 'number') return undefined;
    return (reimbursement ?? 0) - (total ?? 0);
  }

  protected formatMoney(value: number | undefined): string {
    return typeof value === 'number' ? `${value.toFixed(2)} €` : 'n.d.';
  }

  protected budgetLabel(fair: Fair): string {
    const balance = this.fairBalance(fair);
    if (typeof balance !== 'number') return 'Budget n.d.';
    if (balance > 0) return 'Budget positivo';
    if (balance < 0) return 'Budget negativo';
    return 'Budget neutro';
  }

  protected budgetKind(fair: Fair): 'success' | 'warning' | 'neutral' {
    const balance = this.fairBalance(fair);
    if (typeof balance !== 'number') return 'neutral';
    return balance >= 0 ? 'success' : 'warning';
  }

  protected hotelLabel(fair: Fair): string { return fair.hotelPaid ? 'Hotel pagato' : (this.amountValue(fair.hotelCost) ? 'Hotel da pagare' : 'Hotel non registrato'); }
  protected travelLabel(fair: Fair): string { return fair.travelPaid ? 'Viaggio pagato' : (this.amountValue(fair.travelCost) ? 'Viaggio da pagare' : 'Viaggio non definito'); }
  protected standLabel(fair: Fair): string { return fair.standPaid ? 'Stand pagato' : (this.amountValue(fair.standCost) ? 'Stand da pagare' : 'Stand da verificare'); }
  protected reimbursementLabel(fair: Fair): string {
    const reimbursement = this.amountValue(fair.reimbursement);
    return typeof reimbursement === 'number' ? `Rimborso ${this.formatMoney(reimbursement)}` : 'Rimborso n.d.';
  }

  protected eventStatusLabel(fair: Fair): string {
    const today = new Date().toISOString().slice(0, 10);
    if (fair.startDate <= today && today <= fair.endDate) return 'In corso';
    if (fair.endDate < today) return 'Conclusa';
    return 'Solo pianificata';
  }

  protected eventStatusKind(fair: Fair): 'success' | 'warning' | 'neutral' {
    const today = new Date().toISOString().slice(0, 10);
    if (fair.startDate <= today && today <= fair.endDate) return 'success';
    if (fair.endDate < today) return 'neutral';
    return 'warning';
  }

  private emptyDraft(): FairInput {
    return {
      name: '', location: '', locationNotes: '', startDate: '', endDate: '', notes: '', edition: String(new Date().getFullYear()),
      expectedBudget: 0, standCost: 0, reimbursement: 0, hotelCost: 0, travelCost: 0, otherCosts: 0,
      standPaid: false, travelPaid: false, hotelPaid: false,
    };
  }

  private amountValue(value: number | string | undefined): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim()) return Number(value);
    return undefined;
  }
}
