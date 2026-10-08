import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FairService, type FairInput, type FairSeriesInput } from '../../application/fairs/fair.service';
import { FairValidationError } from '../../application/fairs/fair.service';
import { FairTaskService } from '../../application/fairs/fair-task.service';
import { ContactService } from '../../application/contacts/contact.service';
import { OperationService } from '../../application/operations/operation.service';
import type { FairValidationIssue } from '../../domain/rules/fair-validation';
import type { Fair, FairEditionStatus, FairSeriesTaskTemplateItem } from '../../domain/models/fair';
import type { FairSeries } from '../../domain/models/fair';
import type { Operation } from '../../domain/models/operation';
import type { Party } from '../../domain/models/party';
import { FormActionsComponent } from '../../shared/components/form-actions.component';
import { NumberStepperComponent } from '../../shared/components/number-stepper.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { ListFilterPanelComponent } from '../../shared/components/list-filter-panel.component';
import { SwipeRowComponent } from '../../shared/components/swipe-row/swipe-row.component';
import type { SwipeAction } from '../../shared/components/swipe-row/swipe-row.model';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog.service';
import { FairTaskListComponent } from './fair-task-list.component';

type FairSortKey = 'name' | 'year' | 'startDate' | 'balance';
type CoverageFilter = 'all' | 'covered' | 'not-covered';
type CostField = 'expectedBudget' | 'standCost' | 'hotelCost' | 'travelCost' | 'otherCosts';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FairTaskListComponent, FormActionsComponent, FormsModule, ListFilterPanelComponent, NumberStepperComponent, PageHeaderComponent, SwipeRowComponent],
  selector: 'app-fairs-page',
  templateUrl: './fairs-page.html',
  styleUrl: './fairs-page.scss',
})
export class FairsPage implements OnInit {
  private readonly confirmation = inject(ConfirmDialogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(FairService);
  private readonly fairTaskService = inject(FairTaskService);
  private readonly operationService = inject(OperationService);
  private readonly contactService = inject(ContactService);
  protected readonly fairs = signal<readonly Fair[]>([]);
  protected readonly operations = signal<readonly Operation[]>([]);
  protected readonly series = signal<readonly FairSeries[]>([]);
  protected readonly organizerContacts = signal<readonly Party[]>([]);
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
  protected readonly fairStatusFilter = signal<FairEditionStatus | null>(null);
  protected readonly standCoverageFilter = signal<CoverageFilter>('all');
  protected readonly travelCoverageFilter = signal<CoverageFilter>('all');
  protected readonly hotelCoverageFilter = signal<CoverageFilter>('all');
  protected readonly openRowId = signal<string | null>(null);
  protected readonly previousEdition = signal<Fair | null>(null);
  protected readonly editingSeriesId = signal<string | null>(null);
  protected readonly savingSeries = signal(false);
  protected readonly showPastChecklist = signal(false);
  protected readonly seriesFilter = signal<string | null>('all');
  protected seriesDraft: FairSeriesInput = this.emptySeriesDraft();

  protected fairRightActions(fair: Fair): SwipeAction[] {
    return [{ key: 'edit', icon: '✎', label: 'Modifica', kind: 'auto', run: () => this.startEditing(fair) }];
  }

  protected fairLeftActions(fair: Fair): SwipeAction[] {
    return [{ key: 'delete', icon: '🗑', label: 'Elimina', variant: 'danger', kind: 'auto', disabled: this.isFairUsed(fair), run: () => this.remove(fair) }];
  }
  protected readonly otherCoverageFilter = signal<CoverageFilter>('all');
  protected readonly costsMin = signal<number | null>(null);
  protected readonly costsMax = signal<number | null>(null);
  protected readonly revenueMin = signal<number | null>(null);
  protected readonly revenueMax = signal<number | null>(null);
  protected readonly balanceMin = signal<number | null>(null);
  protected readonly balanceMax = signal<number | null>(null);
  protected readonly filtersOpen = signal(false);
  protected readonly sortOpen = signal(false);
  protected readonly sortKey = signal<FairSortKey>('startDate');
  protected readonly sortDirection = signal<'asc' | 'desc'>('desc');
  protected draft: FairInput = this.emptyDraft();

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const year = Number(params.get('year'));
      this.yearFilter.set(Number.isInteger(year) && year > 0 ? year : null);
      const filter = params.get('fairFilter');
      this.fairFilter.set(filter === 'completed' || filter === 'upcoming' ? filter : null);
      const status = params.get('fairStatus');
      this.fairStatusFilter.set(status === 'draft' || status === 'confirmed' || status === 'cancelled' ? status : null);
      this.openIdFromQuery = params.get('open');
      this.tryOpenFromQuery();
    });
    void this.load().then(() => this.tryOpenFromQuery()); void this.loadSeries(); void this.loadOrganizerContacts();
  }

  private openIdFromQuery: string | null = null;
  private tryOpenFromQuery(): void {
    if (!this.openIdFromQuery) return;
    const fair = this.fairs().find((item) => item.id === this.openIdFromQuery);
    if (fair) { this.openIdFromQuery = null; this.startEditing(fair); }
  }

  protected visibleFairs(): readonly Fair[] {
    const year = this.yearFilter();
    const filter = this.fairFilter();
    const today = new Date().toISOString().slice(0, 10);
    const fairs = this.fairs().filter((fair) => {
      if (this.seriesFilter() !== 'all' && fair.fairSeriesId !== this.seriesFilter()) return false;
      if (year && Number(fair.startDate.slice(0, 4)) !== year) return false;
      if (filter === 'completed' && fair.endDate >= today) return false;
      if (filter === 'upcoming' && fair.startDate <= today) return false;
      if (this.fairStatusFilter() && fair.status !== this.fairStatusFilter()) return false;
      if (!this.matchesCoverage(fair, 'stand', this.standCoverageFilter())) return false;
      if (!this.matchesCoverage(fair, 'travel', this.travelCoverageFilter())) return false;
      if (!this.matchesCoverage(fair, 'hotel', this.hotelCoverageFilter())) return false;
      if (!this.matchesCoverage(fair, 'other', this.otherCoverageFilter())) return false;
      if (this.costsMin() !== null && (this.totalCosts(fair) ?? 0) < this.costsMin()!) return false;
      if (this.costsMax() !== null && (this.totalCosts(fair) ?? 0) > this.costsMax()!) return false;
      if (this.revenueMin() !== null && (this.fairRevenue(fair) ?? 0) < this.revenueMin()!) return false;
      if (this.revenueMax() !== null && (this.fairRevenue(fair) ?? 0) > this.revenueMax()!) return false;
      if (this.balanceMin() !== null && (this.fairBalance(fair) ?? 0) < this.balanceMin()!) return false;
      if (this.balanceMax() !== null && (this.fairBalance(fair) ?? 0) > this.balanceMax()!) return false;
      return true;
    });
    return [...fairs].sort((first, second) => { const value = (fair: Fair): string | number => this.sortKey() === 'name' ? fair.name.toLocaleLowerCase() : this.sortKey() === 'year' ? (fair.year ?? Number(fair.startDate.slice(0, 4))) : this.sortKey() === 'balance' ? (this.fairBalance(fair) ?? 0) : fair.startDate; const a = value(first); const b = value(second); const result = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'it', { numeric: true, sensitivity: 'base' }); return this.sortDirection() === 'asc' ? result : -result; });
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

  protected hasActiveFilters(): boolean { return this.seriesFilter() !== 'all' || this.fairFilter() !== null || this.fairStatusFilter() !== null || this.yearFilter() !== null || this.standCoverageFilter() !== 'all' || this.travelCoverageFilter() !== 'all' || this.hotelCoverageFilter() !== 'all' || this.otherCoverageFilter() !== 'all' || this.costsMin() !== null || this.costsMax() !== null || this.revenueMin() !== null || this.revenueMax() !== null || this.balanceMin() !== null || this.balanceMax() !== null; }
  protected closeFilterPanel(): void { this.filtersOpen.set(false); }
  protected resetFilters(): void { this.seriesFilter.set('all'); this.yearFilter.set(null); this.fairFilter.set(null); this.fairStatusFilter.set(null); this.standCoverageFilter.set('all'); this.travelCoverageFilter.set('all'); this.hotelCoverageFilter.set('all'); this.otherCoverageFilter.set('all'); this.costsMin.set(null); this.costsMax.set(null); this.revenueMin.set(null); this.revenueMax.set(null); this.balanceMin.set(null); this.balanceMax.set(null); this.filtersOpen.set(false); void this.router.navigate([], { relativeTo: this.route, queryParams: { year: null, fairFilter: null, fairStatus: null }, queryParamsHandling: 'merge' }); }
  protected statusLabel(status: FairEditionStatus): string { return { draft: 'Bozza', confirmed: 'Confermata', cancelled: 'Annullata' }[status]; }
  protected statusIcon(status: FairEditionStatus): string { return { draft: '📝', confirmed: '✓', cancelled: '🚫' }[status]; }
  protected readonly fairStatusOptions: readonly FairEditionStatus[] = ['draft', 'confirmed', 'cancelled'];
  private matchesCoverage(fair: Fair, cost: 'stand' | 'travel' | 'hotel' | 'other', filter: CoverageFilter): boolean { return filter === 'all' || this.isCostCovered(fair, cost) === (filter === 'covered'); }
  protected hasActiveSort(): boolean { return this.sortKey() !== 'startDate' || this.sortDirection() !== 'desc'; }
  protected toggleSort(): void { this.sortOpen.update((open) => !open); this.filtersOpen.set(false); }
  protected restoreSort(): void { this.sortKey.set('startDate'); this.sortDirection.set('desc'); this.sortOpen.set(false); }
  protected changeSortDirection(): void { this.sortDirection.update((direction) => direction === 'asc' ? 'desc' : 'asc'); }
  @HostListener('document:click', ['$event']) protected closeSortOutside(event: MouseEvent): void { const target = event.target; if (this.sortOpen() && (!(target instanceof Element) || (!target.closest('.sort-panel') && !target.closest('.sort-toggle')))) this.sortOpen.set(false); }

  protected changeFairFilter(filter: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { fairFilter: filter || null }, queryParamsHandling: 'merge' });
  }

  protected changeFairStatusFilter(status: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { fairStatus: status || null }, queryParamsHandling: 'merge' });
  }

  protected startCreating(): void {
    this.resetMessages();
    this.draft = this.emptyDraft();
    this.matchedSeries.set(null);
    this.previousEdition.set(null);
    this.showPastChecklist.set(false);
    this.warningsAcknowledged = false;
    this.creating.set(true);
  }

  protected startEditing(fair: Fair): void {
    this.resetMessages();
    this.draft = { ...this.emptyDraft(), ...fair, edition: fair.edition || String(fair.year ?? ''), fairSeriesId: fair.fairSeriesId };
    this.matchedSeries.set(null);
    this.previousEdition.set(this.computePreviousEdition(fair.fairSeriesId, fair.id, fair.startDate));
    this.showPastChecklist.set(false);
    this.warningsAcknowledged = false;
    this.editingId.set(fair.id);
  }

  protected cancelForm(): void { this.creating.set(false); this.editingId.set(null); this.warningsAcknowledged = false; this.validationIssues.set([]); this.previousEdition.set(null); this.showPastChecklist.set(false); }

  protected onFairNameChange(name: string): void {
    const match = this.series().find((series) => series.name.toLowerCase() === name.trim().toLowerCase());
    this.matchedSeries.set(match ?? null);
  }

  protected useExistingSeries(series: FairSeries): void {
    const previous = this.computePreviousEdition(series.id, this.editingId() ?? undefined, this.draft.startDate || undefined);
    this.previousEdition.set(previous);
    this.draft = {
      ...this.draft,
      fairSeriesId: series.id,
      location: this.draft.location || series.defaultLocation || '',
      expectedBudget: this.draft.expectedBudget || previous?.expectedBudget || 0,
      standCost: this.draft.standCost || previous?.standCost || 0,
      hotelCost: this.draft.hotelCost || previous?.hotelCost || 0,
      travelCost: this.draft.travelCost || previous?.travelCost || 0,
      otherCosts: this.draft.otherCosts || previous?.otherCosts || 0,
    };
    this.matchedSeries.set(null);
  }

  protected useNewSeries(): void {
    this.draft = { ...this.draft, fairSeriesId: undefined };
    this.matchedSeries.set(null);
  }

  protected currentSeriesTaskTemplate(): readonly FairSeriesTaskTemplateItem[] | undefined {
    return this.series().find((item) => item.id === this.draft.fairSeriesId)?.taskTemplate;
  }

  protected isPastFair(): boolean { return Boolean(this.draft.endDate) && this.draft.endDate < this.today(); }

  private today(): string { return new Date().toISOString().slice(0, 10); }

  protected previousCostValue(field: CostField): number | undefined { return this.previousEdition()?.[field]; }

  protected costDelta(field: CostField): number | undefined {
    const previous = this.previousCostValue(field);
    if (previous === undefined) return undefined;
    return (this.amountValue(this.draft[field]) ?? 0) - previous;
  }

  protected startEditingSeries(seriesId: string): void {
    const found = this.series().find((item) => item.id === seriesId);
    if (!found) return;
    this.seriesDraft = { name: found.name, organizerPartyId: found.organizerPartyId, organizerName: found.organizerName ?? '', organizerContact: found.organizerContact ?? '', organizerEmail: found.organizerEmail ?? '', organizerPhone: found.organizerPhone ?? '', website: found.website ?? '', defaultLocation: found.defaultLocation ?? '', notes: found.notes ?? '', taskTemplate: found.taskTemplate };
    this.editingSeriesId.set(seriesId);
  }

  protected cancelSeriesForm(): void { this.editingSeriesId.set(null); }

  protected async saveSeries(): Promise<void> {
    const id = this.editingSeriesId();
    if (!id) return;
    this.savingSeries.set(true); this.resetMessages();
    try {
      await this.service.updateSeries(id, this.seriesDraft);
      await this.loadSeries();
      this.editingSeriesId.set(null);
      this.successMessage.set('Dati serie aggiornati.');
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile aggiornare la serie.'); }
    finally { this.savingSeries.set(false); }
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
      const wasCreating = !this.editingId();
      const saved = this.editingId() ? await this.service.update(this.editingId()!, this.draft, true) : await this.service.create(this.draft, true);
      this.validationIssues.set([]);
      await this.load(); await this.loadSeries();
      if (wasCreating) {
        const matchedSeriesForTasks = this.series().find((item) => item.id === saved.fairSeriesId);
        await this.fairTaskService.createDefaults(saved.id, matchedSeriesForTasks?.taskTemplate, this.previousEdition()?.id);
        this.creating.set(false);
        this.startEditing(this.fairs().find((item) => item.id === saved.id) ?? saved);
        this.successMessage.set('Fiera creata: completa la checklist organizzativa.');
      } else {
        this.cancelForm();
        this.successMessage.set('Fiera salvata localmente.');
      }
    } catch (error) { if (error instanceof FairValidationError) this.validationIssues.set(error.issues); else this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare la fiera.'); }
    finally { this.saving.set(false); }
  }

  protected async remove(fair: Fair): Promise<void> {
    if (!(await this.confirmation.confirm(`Eliminare logicamente la fiera "${fair.name}"?`))) return;
    this.resetMessages();
    try { await this.service.delete(fair.id); this.successMessage.set('Fiera eliminata logicamente.'); await this.load(); }
    catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare la fiera.'); }
  }

  private async load(): Promise<void> { this.loading.set(true); try { const [fairs, operations] = await Promise.all([this.service.list(), this.operationService.list()]); this.fairs.set(fairs); this.operations.set(operations); } catch { this.errorMessage.set('Impossibile caricare le fiere.'); } finally { this.loading.set(false); } }
  private async loadSeries(): Promise<void> { try { this.series.set(await this.service.listSeries()); } catch { this.errorMessage.set('Impossibile caricare le serie di fiere.'); } }
  private async loadOrganizerContacts(): Promise<void> { try { this.organizerContacts.set(await this.contactService.list({ role: 'organizer' })); } catch { /* il form resta usabile con i soli campi legacy se l'anagrafica non e disponibile */ } }
  private resetMessages(): void { this.errorMessage.set(''); this.successMessage.set(''); }
  private computePreviousEdition(seriesId: string | undefined, excludeId: string | undefined, beforeDate: string | undefined): Fair | null {
    if (!seriesId) return null;
    const candidates = this.fairs().filter((fair) => fair.fairSeriesId === seriesId && fair.id !== excludeId && (!beforeDate || fair.startDate < beforeDate));
    if (!candidates.length) return null;
    return [...candidates].sort((first, second) => second.startDate.localeCompare(first.startDate))[0];
  }
  private emptySeriesDraft(): FairSeriesInput {
    return { name: '', organizerPartyId: undefined, organizerName: '', organizerContact: '', organizerEmail: '', organizerPhone: '', website: '', defaultLocation: '', notes: '', taskTemplate: undefined };
  }
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
