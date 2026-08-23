import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FairContextService } from '../event/fair-context.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-mobile-action-bar',
  template: `
    <nav class="mobile-bar" aria-label="Navigazione mobile">
      <a routerLink="/dashboard">⌂<span>Home</span></a>
      <a routerLink="/events">◷<span>Eventi</span></a>
      <a class="fab" [routerLink]="fairModeActive() ? '/sales' : '/works'" [attr.aria-label]="fairModeActive() ? 'Nuova vendita fiera' : 'Nuova commissione'">+</a>
      <a routerLink="/catalog">□<span>Catalogo</span></a>
      <a routerLink="/settings">•••<span>Altro</span></a>
    </nav>
  `,
  styles: `
    :host { display: none; } .mobile-bar { align-items: center; background: var(--color-primary); bottom: 0; box-shadow: var(--shadow-lg); color: var(--color-surface); display: flex; height: 4.5rem; justify-content: space-around; left: 0; padding: 0 .5rem; position: fixed; right: 0; z-index: var(--z-fixed); } .mobile-bar a { align-items: center; color: inherit; display: flex; flex-direction: column; font-size: 1.25rem; gap: .2rem; justify-content: center; min-width: 3.5rem; text-decoration: none; } .mobile-bar span { font: 600 .65rem var(--font-sans); } .mobile-bar .fab { background: var(--color-accent); border: .35rem solid var(--color-surface); border-radius: 50%; color: var(--color-primary); font-size: 2rem; height: 3.5rem; margin-top: -1.5rem; min-width: 3.5rem; width: 3.5rem; } @media (max-width: 699px) { :host { display: block; } }
  `,
})
export class MobileActionBarComponent {
  private readonly fairContext = inject(FairContextService);
  protected readonly fairModeActive = this.fairContext.fairModeActive;
}
