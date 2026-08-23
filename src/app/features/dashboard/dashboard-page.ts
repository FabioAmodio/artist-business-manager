import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FairContextService } from '../../core/event/fair-context.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink],
  selector: 'app-dashboard-page',
  template: `
    <section class="dashboard" aria-labelledby="dashboard-title">
      @if (dashboard().fair; as fair) {
        <header class="dashboard-header fair-header">
          <div>
            <p class="eyebrow">Modalita fiera</p>
            <h1 id="dashboard-title">{{ fair.name }}</h1>
            <p class="muted">{{ fair.location }} · {{ fair.startDate }} - {{ fair.endDate }}</p>
          </div>
          <span class="live-badge">Attiva</span>
        </header>
        <div class="kpi-grid">
          <article class="kpi"><span>Giorni rimanenti</span><strong>{{ dashboard().daysRemaining }}</strong></article>
          <article class="kpi"><span>Vendite oggi</span><strong>{{ dashboard().todaySales | currency }}</strong></article>
          <article class="kpi"><span>Incasso cumulativo</span><strong>{{ dashboard().cumulativeSales | currency }}</strong></article>
          <article class="kpi"><span>Numero vendite</span><strong>{{ dashboard().saleCount }}</strong></article>
        </div>
        <section class="coverage" aria-labelledby="coverage-title">
          <div><p class="eyebrow">Sostenibilita evento</p><h2 id="coverage-title">Copertura costi</h2></div>
          <strong [class.positive]="dashboard().profit >= 0">{{ dashboard().profit | currency }}</strong>
          <p>{{ dashboard().uncoveredCosts > 0 ? ('Mancano ' + (dashboard().uncoveredCosts | currency) + ' per coprire i costi') : 'Costi previsti coperti' }}</p>
        </section>
        <a class="primary-action" routerLink="/sales">+ Nuova vendita fiera</a>
      } @else {
        <header class="dashboard-header">
          <div><p class="eyebrow">Quadro generale</p><h1 id="dashboard-title">La tua attivita</h1><p class="muted">Nessuna fiera attiva oggi.</p></div>
          <a class="primary-action" routerLink="/works">+ Nuova commissione</a>
        </header>
        <div class="kpi-grid">
          <article class="kpi"><span>Vendite del periodo</span><strong>0,00 €</strong></article>
          <article class="kpi"><span>Commissioni aperte</span><strong>0</strong></article>
          <article class="kpi"><span>Clienti attivi</span><strong>0</strong></article>
          <article class="kpi"><span>Prossime fiere</span><strong>0</strong></article>
        </div>
        <section class="empty-state"><h2>Pronto per il prossimo passo?</h2><p>Attiva una fiera dalla sezione Eventi per trasformare questa dashboard nel tuo pannello operativo.</p><a routerLink="/events">Gestisci fiere</a></section>
      }
    </section>
  `,
  styles: `
    .dashboard { max-width: 70rem; width: 100%; margin: 0 auto; padding: clamp(1.5rem, 4vw, 3.5rem); box-sizing: border-box; }
    .dashboard-header { display: flex; align-items: end; justify-content: space-between; gap: 2rem; border-top: 3px solid var(--color-accent); padding-top: 1.25rem; }
    .eyebrow { color: var(--color-accent); font: 600 .72rem var(--font-mono); letter-spacing: .08em; text-transform: uppercase; margin: 0 0 .75rem; }
    h1, h2 { color: var(--color-primary); font-family: var(--font-serif); font-weight: 400; margin: 0; } h1 { font-size: clamp(2rem, 5vw, 4rem); line-height: 1; } h2 { font-size: 1.5rem; }
    .muted, .kpi span, .coverage p { color: var(--color-text-secondary); } .live-badge { color: var(--color-status-success); font-weight: 700; }
    .primary-action, .empty-state a { background: var(--color-primary); color: var(--color-surface); padding: .8rem 1rem; text-decoration: none; border-radius: var(--radius-base); font-weight: 600; white-space: nowrap; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 2rem 0; } .kpi { border-top: 1px solid var(--color-border); padding: 1rem 0; } .kpi span { display: block; font-size: .82rem; } .kpi strong { display: block; color: var(--color-primary); font: 400 1.8rem var(--font-serif); margin-top: .5rem; }
    .coverage { background: var(--color-surface-secondary); padding: 1.25rem; display: grid; grid-template-columns: 1fr auto; gap: .25rem 1rem; margin-top: 1rem; } .coverage .eyebrow, .coverage h2, .coverage p { grid-column: 1; } .coverage > strong { grid-column: 2; grid-row: 1 / span 2; font: 400 2rem var(--font-serif); } .positive { color: var(--color-status-success); }
    .empty-state { border: 1px solid var(--color-border); padding: 2rem; margin-top: 1rem; } .empty-state p { color: var(--color-text-secondary); margin-bottom: 1.5rem; }
    @media (max-width: 699px) { .dashboard-header { align-items: start; flex-direction: column; } .kpi-grid { grid-template-columns: repeat(2, 1fr); } .primary-action { width: 100%; text-align: center; box-sizing: border-box; } }
  `,
})
export class DashboardPage {
  private readonly fairContext = inject(FairContextService);
  protected readonly dashboard = this.fairContext.dashboard;
}
