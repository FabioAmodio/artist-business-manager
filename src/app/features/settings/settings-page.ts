import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FairContextService } from '../../core/event/fair-context.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-settings-page',
  template: `
    <section class="settings" aria-labelledby="settings-title">
      <p class="eyebrow">Impostazioni · Informazioni</p>
      <h1 id="settings-title">Trasparenza AI</h1>
      <p class="intro">Artist Business Manager e stato progettato e sviluppato con il supporto di strumenti di Intelligenza Artificiale.</p>
      <section class="info-panel">
        <p>Le decisioni progettuali, architetturali e funzionali sono supervisionate e validate dallo sviluppatore.</p>
        <p>Le funzionalita che utilizzano direttamente sistemi di Intelligenza Artificiale saranno chiaramente identificate nell'applicazione.</p>
      </section>
      <fieldset>
        <legend>Preferenze future</legend>
        <label><input type="checkbox" [checked]="settings().enabled" (change)="toggleEnabled($event)" /> Abilita funzionalita assistite da AI</label>
        <label><input type="checkbox" [checked]="settings().allowCloudProcessing" (change)="toggleCloud($event)" /> Consenti elaborazione su servizi cloud</label>
      </fieldset>
      <p class="status">Stato consenso: <strong>{{ settings().consentGiven ? 'concesso' : 'non concesso' }}</strong></p>
    </section>
  `,
  styles: `
    .settings { max-width: 48rem; padding: clamp(1.5rem, 4vw, 3.5rem); } .eyebrow { color: var(--color-accent); font: 600 .72rem var(--font-mono); letter-spacing: .08em; text-transform: uppercase; } h1 { color: var(--color-primary); font: 400 clamp(2rem, 5vw, 3.5rem) var(--font-serif); margin: 0 0 1rem; } .intro, .info-panel, .status { color: var(--color-text-secondary); line-height: 1.6; } .info-panel { border-left: 3px solid var(--color-accent); background: var(--color-surface-secondary); padding: 1rem 1.25rem; margin: 2rem 0; } fieldset { border: 1px solid var(--color-border); padding: 1.25rem; display: grid; gap: 1rem; } legend { color: var(--color-primary); font-weight: 700; padding: 0 .5rem; } label { color: var(--color-text-primary); display: flex; gap: .75rem; align-items: center; } input { accent-color: var(--color-accent); min-width: 1.1rem; min-height: 1.1rem; }
  `,
})
export class SettingsPage {
  private readonly fairContext = inject(FairContextService);
  protected readonly settings = this.fairContext.transparencySettings;

  protected toggleEnabled(event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.fairContext.updateAiSettings({ ...this.settings(), enabled, consentGiven: enabled });
  }

  protected toggleCloud(event: Event): void {
    const allowCloudProcessing = (event.target as HTMLInputElement).checked;
    this.fairContext.updateAiSettings({ ...this.settings(), allowCloudProcessing });
  }
}
