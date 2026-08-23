import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FairService, type FairInput } from '../../application/fairs/fair.service';
import type { Fair } from '../../domain/models/fair';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
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

      @if (editingId() || creating()) {
        <form class="fair-form" (ngSubmit)="save()" #fairForm="ngForm">
          <div class="form-heading">
            <h2>{{ editingId() ? 'Modifica fiera' : 'Nuova fiera' }}</h2>
            <button class="text-button" type="button" (click)="cancelForm()">Annulla</button>
          </div>
          <div class="form-grid">
            <label>Nome <input name="name" required [(ngModel)]="draft.name" /></label>
            <label>Luogo <input name="location" required [(ngModel)]="draft.location" /></label>
            <label>Data inizio <input name="startDate" type="date" required [(ngModel)]="draft.startDate" /></label>
            <label>Data fine <input name="endDate" type="date" required [(ngModel)]="draft.endDate" /></label>
            <label class="full-width">Note <textarea name="notes" rows="3" [(ngModel)]="draft.notes"></textarea></label>
          </div>
          <button class="primary-button" type="submit" [disabled]="fairForm.invalid || saving()">{{ saving() ? 'Salvataggio...' : 'Salva fiera' }}</button>
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
              <div><h3>{{ fair.name }}</h3><p>{{ fair.location }} · {{ fair.startDate }} - {{ fair.endDate }}</p>@if (fair.notes) {<small>{{ fair.notes }}</small>}</div>
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
    .feedback { padding: .75rem 1rem; } .error { background: color-mix(in srgb, var(--color-status-error) 12%, transparent); color: var(--color-status-error); } .success { background: color-mix(in srgb, var(--color-status-success) 12%, transparent); color: var(--color-status-success); }
    .fair-form, .empty-state { border: 1px solid var(--color-border); margin: 2rem 0; padding: 1.25rem; } .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin: 1.5rem 0; } label { color: var(--color-text-primary); display: grid; gap: .4rem; font-weight: 600; } input, textarea { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); box-sizing: border-box; color: var(--color-text-primary); font: inherit; padding: .7rem; width: 100%; } input:focus, textarea:focus { border-color: var(--color-accent); outline: 2px solid color-mix(in srgb, var(--color-accent) 30%, transparent); } .full-width { grid-column: 1 / -1; }
    .list-heading { border-bottom: 1px solid var(--color-border); padding-bottom: .75rem; } .fair-list { display: grid; gap: .75rem; } .fair-row { align-items: start; border-bottom: 1px solid var(--color-border); padding: 1rem 0; } .fair-row p { margin: .4rem 0; } .fair-row small { display: block; } .row-actions { display: flex; gap: .25rem; flex-shrink: 0; }
    @media (max-width: 699px) { .page-header, .fair-row { align-items: stretch; flex-direction: column; } .primary-button { width: 100%; } .form-grid { grid-template-columns: 1fr; } .full-width { grid-column: auto; } .row-actions { justify-content: flex-end; } }
  `,
})
export class FairsPage implements OnInit {
  private readonly service = inject(FairService);
  protected readonly fairs = signal<readonly Fair[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly creating = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected draft: FairInput = { name: '', location: '', startDate: '', endDate: '', notes: '' };

  ngOnInit(): void { void this.load(); }

  protected startCreating(): void {
    this.resetMessages();
    this.draft = { name: '', location: '', startDate: '', endDate: '', notes: '' };
    this.creating.set(true);
  }

  protected startEditing(fair: Fair): void {
    this.resetMessages();
    this.draft = { name: fair.name, location: fair.location, startDate: fair.startDate, endDate: fair.endDate, notes: fair.notes ?? '' };
    this.editingId.set(fair.id);
  }

  protected cancelForm(): void { this.creating.set(false); this.editingId.set(null); }

  protected async save(): Promise<void> {
    this.saving.set(true); this.resetMessages();
    try {
      if (this.editingId()) await this.service.update(this.editingId()!, this.draft);
      else await this.service.create(this.draft);
      this.cancelForm(); this.successMessage.set('Fiera salvata localmente.'); await this.load();
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile salvare la fiera.'); }
    finally { this.saving.set(false); }
  }

  protected async remove(fair: Fair): Promise<void> {
    if (!window.confirm(`Eliminare logicamente la fiera "${fair.name}"?`)) return;
    this.resetMessages();
    try { await this.service.delete(fair.id); this.successMessage.set('Fiera eliminata logicamente.'); await this.load(); }
    catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile eliminare la fiera.'); }
  }

  private async load(): Promise<void> { this.loading.set(true); try { this.fairs.set(await this.service.list()); } catch { this.errorMessage.set('Impossibile caricare le fiere.'); } finally { this.loading.set(false); } }
  private resetMessages(): void { this.errorMessage.set(''); this.successMessage.set(''); }
}
