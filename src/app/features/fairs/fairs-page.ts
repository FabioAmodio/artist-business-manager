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
  template: `
    <section class="fairs-page" aria-labelledby="fairs-title">
      <header class="page-header">
        <div>
          <p class="eyebrow">Eventi</p>
          <h1 id="fairs-title">Fiere</h1>
          <p class="intro">Organizza gli appuntamenti e ritrova rapidamente il contesto operativo.</p>
        </div>
        @if (!editingId()) {
          <button class="primary-button" type="button" (click)="startCreating()">+ Nuova fiera</button>
        }
      </header>

      @if (errorMessage()) {
        <p class="feedback error" role="alert">{{ errorMessage() }}</p>
      }
      @if (successMessage()) {
        <p class="feedback success" role="status">{{ successMessage() }}</p>
      }
      @if (validationIssues().length) {
        <div class="validation-list" role="alert">
          @for (issue of validationIssues(); track issue.code + issue.message) {
            <p [class.validation-error]="issue.severity === 'ERROR'" [class.validation-warning]="issue.severity === 'WARNING'">
              <strong>{{ issue.severity === 'ERROR' ? 'Errore' : 'Attenzione' }}:</strong> {{ issue.message }}
            </p>
          }
        </div>
      }

      @if (editingId() || creating()) {
        <form class="fair-form" (ngSubmit)="save()" #fairForm="ngForm">
          <div class="form-heading">
            <h2>{{ editingId() ? 'Modifica fiera' : 'Nuova fiera' }}</h2>
          </div>
          <div class="form-grid">
            <div class="form-row form-row-identity">
              <label>Nome fiera
                <input name="name" required list="fair-series-list" [(ngModel)]="draft.name" (ngModelChange)="onFairNameChange($event)" />
                <datalist id="fair-series-list">@for (series of series(); track series.id) { <option [value]="series.name"></option> }</datalist>
              </label>
              <label [class.field-error]="hasFieldError('edition')">Edizione <input name="edition" placeholder="es. Primavera 2026" required [(ngModel)]="draft.edition" /></label>
            </div>
            <div class="form-row form-row-dates">
              <label [class.field-error]="hasFieldError('startDate')">Data inizio <input name="startDate" type="date" required [(ngModel)]="draft.startDate" [attr.aria-invalid]="hasFieldError('startDate')" /></label>
              <label [class.field-error]="hasFieldError('endDate')">Data fine <input name="endDate" type="date" required [(ngModel)]="draft.endDate" [attr.aria-invalid]="hasFieldError('endDate')" /></label>
            </div>
            <div class="form-row form-row-location">
              <label [class.field-error]="hasFieldError('location')">Luogo <input name="location" required [(ngModel)]="draft.location" /></label>
              <label>Note luogo <input name="locationNotes" [(ngModel)]="draft.locationNotes" /></label>
            </div>
            <label class="full-width">Note <textarea name="notes" rows="3" [(ngModel)]="draft.notes"></textarea></label>
          </div>
          @if (matchedSeries(); as matched) {
            <div class="series-suggestion" role="status">
              <p>Hai gia partecipato a <strong>{{ matched.name }}</strong>. Vuoi creare una nuova edizione?</p>
              <div><button class="primary-button" type="button" (click)="useExistingSeries(matched)">Nuova edizione</button><button class="text-button" type="button" (click)="useNewSeries()">Nuova fiera</button></div>
            </div>
          }
          <app-form-actions [disabled]="fairForm.invalid === true" [saving]="saving()" [saveLabel]="hasWarnings() ? 'Salva comunque' : 'Salva fiera'" (cancel)="cancelForm()"></app-form-actions>
        </form>
      }

      <div class="list-heading"><h2>Elenco fiere</h2><span>{{ fairs().length }} registrate</span></div>
      @if (loading()) {
        <p class="empty-state">Caricamento...</p>
      } @else if (!fairs().length) {
        <div class="empty-state"><h3>Nessuna fiera registrata</h3><p>Inizia creando il prossimo evento a cui parteciperai.</p><button class="primary-button" type="button" (click)="startCreating()">Crea la prima fiera</button></div>
      } @else {
        <div class="fair-list">
          @for (fair of fairs(); track fair.id) {
            <article class="fair-row">
              <div><h3>{{ fair.name }} · {{ fair.edition || fair.year }}</h3><p>{{ fair.location }} · {{ fair.startDate }} - {{ fair.endDate }}</p>@if (fair.locationNotes) {<small>{{ fair.locationNotes }}</small>} @if (fair.notes) {<small>{{ fair.notes }}</small>}</div>
              <div class="row-actions"><button class="text-button" type="button" (click)="startEditing(fair)">Modifica</button><button class="danger-button" type="button" (click)="remove(fair)">Elimina</button></div>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .fairs-page { max-width: 70rem; width: 100%; margin: 0 auto; padding: clamp(1.5rem, 4vw, 3.5rem); box-sizing: border-box; }
    .page-header, .form-heading, .list-heading, .fair-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .page-header { align-items: end; border-top: 3px solid var(--color-accent); padding-top: 1.25rem; } .eyebrow { color: var(--color-accent); font: 600 .72rem var(--font-mono); letter-spacing: .08em; text-transform: uppercase; margin: 0 0 .75rem; } h1, h2, h3 { color: var(--color-primary); font-family: var(--font-serif); font-weight: 400; margin: 0; } h1 { font-size: clamp(2rem, 5vw, 4rem); line-height: 1; } h2 { font-size: 1.5rem; } h3 { font-size: 1.25rem; } .intro, .list-heading span, .fair-row p, .fair-row small, .empty-state p { color: var(--color-text-secondary); }
    .primary-button, .danger-button, .text-button { border: 0; border-radius: var(--radius-base); cursor: pointer; font: 600 .9rem var(--font-sans); padding: .75rem 1rem; } .primary-button { background: var(--color-primary); color: var(--color-surface); } .danger-button { background: transparent; color: var(--color-status-error); } .text-button { background: transparent; color: var(--color-primary); } button:disabled { cursor: wait; opacity: .6; }
    .feedback { padding: .75rem 1rem; } .error { background: color-mix(in srgb, var(--color-status-error) 12%, transparent); color: var(--color-status-error); } .success { background: color-mix(in srgb, var(--color-status-success) 12%, transparent); color: var(--color-status-success); } .validation-list { margin: 1rem 0; } .validation-list p { margin: .35rem 0; padding: .7rem 1rem; } .validation-error, .field-error { color: var(--color-status-error); } .validation-error { background: color-mix(in srgb, var(--color-status-error) 12%, transparent); } .validation-warning { background: color-mix(in srgb, var(--color-status-warning) 14%, transparent); color: var(--color-text-primary); } .field-error input { border-color: var(--color-status-error); }
    .fair-form, .empty-state { border: 1px solid var(--color-border); margin: 2rem 0; padding: 1.25rem; } .form-grid { display: grid; gap: 1rem; margin: 1.5rem 0; } .form-row { display: grid; gap: 1rem; } .form-row-identity { grid-template-columns: 1.5fr 1fr; } .form-row-dates, .form-row-location { grid-template-columns: repeat(2, minmax(0, 1fr)); } label { color: var(--color-text-primary); display: grid; gap: .4rem; font-weight: 600; } input, textarea { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); box-sizing: border-box; color: var(--color-text-primary); font: inherit; padding: .7rem; width: 100%; } input:focus, textarea:focus { border-color: var(--color-accent); outline: 2px solid color-mix(in srgb, var(--color-accent) 30%, transparent); } .full-width { grid-column: 1 / -1; } .series-suggestion { background: var(--color-surface-secondary); border-left: 3px solid var(--color-accent); margin-bottom: 1rem; padding: .75rem 1rem; } .series-suggestion p { margin: 0 0 .75rem; } .series-suggestion div { display: flex; gap: .5rem; }
    .list-heading { border-bottom: 1px solid var(--color-border); padding-bottom: .75rem; } .fair-list { display: grid; gap: .75rem; } .fair-row { align-items: start; border-bottom: 1px solid var(--color-border); padding: 1rem 0; } .fair-row p { margin: .4rem 0; } .fair-row small { display: block; } .row-actions { display: flex; gap: .25rem; flex-shrink: 0; }
    @media (max-width: 699px) { .page-header, .fair-row { align-items: stretch; flex-direction: column; } .primary-button { width: 100%; } .form-row-identity, .form-row-dates, .form-row-location { grid-template-columns: 1fr; } .full-width { grid-column: auto; } .row-actions { justify-content: flex-end; } .series-suggestion div { flex-direction: column; } }
  `,
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
  protected draft: FairInput = { name: '', location: '', locationNotes: '', startDate: '', endDate: '', notes: '', edition: String(new Date().getFullYear()) };

  ngOnInit(): void { void this.load(); void this.loadSeries(); }

  protected startCreating(): void {
    this.resetMessages();
    this.draft = { name: '', location: '', locationNotes: '', startDate: '', endDate: '', notes: '', edition: String(new Date().getFullYear()) };
    this.matchedSeries.set(null);
    this.warningsAcknowledged = false;
    this.creating.set(true);
  }

  protected startEditing(fair: Fair): void {
    this.resetMessages();
    this.draft = { name: fair.name, location: fair.location, locationNotes: fair.locationNotes ?? '', startDate: fair.startDate, endDate: fair.endDate, notes: fair.notes ?? '', edition: fair.edition || String(fair.year ?? ''), fairSeriesId: fair.fairSeriesId };
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
}
