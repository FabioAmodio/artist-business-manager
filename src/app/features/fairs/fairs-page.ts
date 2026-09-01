import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FairService, type FairInput } from '../../application/fairs/fair.service';
import { FairValidationError } from '../../application/fairs/fair.service';
import { OperationService } from '../../application/operations/operation.service';
import type { FairValidationIssue } from '../../domain/rules/fair-validation';
import type { Fair } from '../../domain/models/fair';
import type { FairSeries } from '../../domain/models/fair';
import type { Operation } from '../../domain/models/operation';
import { FormActionsComponent } from '../../shared/components/form-actions.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormActionsComponent, FormsModule, PageHeaderComponent],
  selector: 'app-fairs-page',
  templateUrl: './fairs-page.html',
  styleUrl: './fairs-page.scss',
})
export class FairsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(FairService);
  private readonly operationService = inject(OperationService);
  protected readonly fairs = signal<readonly Fair[]>([]);
  protected readonly operations = signal<readonly Operation[]>([]);
  protected readonly series = signal<readonly FairSeries[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly validationIssues = signal<readonly FairValidationIssue[]>([]);
  protected readonly matchedSeries = signal<FairSeries | null>(null);
  protected readonly yearFilter = signal<number | null>(null);
  protected readonly fairFilter = signal<'completed' | 'upcoming' | null>(null);
  protected readonly filtersOpen = signal(false);
  protected draft: FairInput = this.emptyDraft();

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const year = Number(params.get('year'));
      this.yearFilter.set(Number.isInteger(year) && year > 0 ? year : null);
      const filter = params.get('fairFilter');
      this.fairFilter.set(filter === 'completed' || filter === 'upcoming' ? filter : null);
    });
    void this.load(); void this.loadSeries();
  }

  protected visibleFairs(): readonly Fair[] {
    const year = this.yearFilter();
    const filter = this.fairFilter();
    const today = new Date().toISOString().slice(0, 10);
    return this.fairs().filter((fair) => {
      if (year && Number(fair.startDate.slice(0, 4)) !== year) return false;
      if (filter === 'completed' && fair.endDate >= today) return false;
      if (filter === 'upcoming' && fair.startDate <= today) return false;
      return true;
    });
  }

  protected availableYears(): readonly number[] {
    return [...new Set([new Date().getFullYear(), ...this.fairs().map((fair) => Number(fair.startDate.slice(0, 4)))])]
      .filter((year) => Number.isInteger(year) && year > 0)
      .sort((first, second) => second - first);
  }

  protected yearFilterOptions(): readonly { readonly value: string; readonly label: string }[] {
    return [{ value: '', label: 'Tutti' }, ...this.availableYears().map((year) => ({ value: String(year), label: String(year) }))];
  }

  protected changeYearFilter(value: string): void { this.changeYear(value ? Number(value) : null); }

  protected changeYear(year: number | null): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { year }, queryParamsHandling: 'merge' });
  }

  protected hasActiveFilters(): boolean { return this.fairFilter() !== null; }

  protected changeFairFilter(filter: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { fairFilter: filter || null }, queryParamsHandling: 'merge' });
  }

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

  private async load(): Promise<void> { this.loading.set(true); try { const [fairs, operations] = await Promise.all([this.service.list(), this.operationService.list()]); this.fairs.set(fairs); this.operations.set(operations); } catch { this.errorMessage.set('Impossibile caricare le fiere.'); } finally { this.loading.set(false); } }
  private async loadSeries(): Promise<void> { try { this.series.set(await this.service.listSeries()); } catch { this.errorMessage.set('Impossibile caricare le serie di fiere.'); } }
  private resetMessages(): void { this.errorMessage.set(''); this.successMessage.set(''); }
  private warningsAcknowledged = false;
  protected hasWarnings(): boolean { return this.validationIssues().some((issue) => issue.severity === 'WARNING'); }
  protected hasFieldError(field: string): boolean { return this.validationIssues().some((issue) => issue.severity === 'ERROR' && issue.fields?.includes(field)); }
  protected isFairUsed(fair: Fair): boolean { return this.operations().some((operation) => operation.fairEditionId === fair.id); }

  protected totalCosts(fair: Fair): number | undefined {
    const values = [fair.standCost, fair.hotelCost, fair.travelCost, fair.otherCosts]
      .map((value) => this.amountValue(value))
      .filter((value): value is number => typeof value === 'number');
    return values.length ? values.reduce((sum, value) => sum + value, 0) : undefined;
  }

  protected fairBalance(fair: Fair): number | undefined {
    const revenue = this.fairRevenue(fair);
    const total = this.totalCosts(fair);
    if (typeof revenue !== 'number' && typeof total !== 'number') return undefined;
    return (revenue ?? 0) - (total ?? 0);
  }

  protected fairRevenue(fair: Fair): number | undefined {
    const sales = this.operations()
      // le righe "work" generate da un pacchetto sono la quota di ricavo di un servizio venduto insieme ad altri elementi
      .filter((operation) => operation.fairEditionId === fair.id && (operation.type === 'sale' || (operation.type === 'work' && Boolean(operation.parentOperationId))))
      .reduce((total, operation) => total + (operation.amount ?? 0), 0);
    const reimbursement = this.amountValue(fair.reimbursement);
    if (!sales && typeof reimbursement !== 'number') return undefined;
    return sales + (reimbursement ?? 0);
  }

  protected isCostCovered(fair: Fair, cost: 'stand' | 'travel' | 'hotel' | 'other'): boolean {
    let available = this.fairRevenue(fair) ?? 0;
    for (const currentCost of ['stand', 'travel', 'hotel', 'other'] as const) {
      const amount = this.amountValue(this.costAmount(fair, currentCost)) ?? 0;
      if (currentCost === cost) return available >= amount;
      available -= amount;
    }
    return false;
  }

  protected coverageLabel(fair: Fair, cost: 'stand' | 'travel' | 'hotel' | 'other'): string {
    const labels = { stand: 'Stand', travel: 'Viaggio', hotel: 'Hotel', other: 'Altri costi' };
    return `${labels[cost]} ${this.isCostCovered(fair, cost) ? 'coperto' : 'non coperto'}`;
  }

  protected hasOtherCosts(fair: Fair): boolean { return (this.amountValue(fair.otherCosts) ?? 0) !== 0; }

  protected formatMoney(value: number | undefined): string {
    return typeof value === 'number' ? `${value.toFixed(2)} €` : 'n.d.';
  }

  private costAmount(fair: Fair, cost: 'stand' | 'travel' | 'hotel' | 'other'): number | undefined {
    return { stand: fair.standCost, travel: fair.travelCost, hotel: fair.hotelCost, other: fair.otherCosts }[cost];
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
