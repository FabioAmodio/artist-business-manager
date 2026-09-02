import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet, ActivatedRoute, Router } from '@angular/router';
import { ResponsiveNavComponent } from './core/navigation/responsive-nav.component';
import { MobileActionBarComponent } from './core/navigation/mobile-action-bar.component';
import { AppStateService } from './core/state/app-state.service';
import { SyncStatusService } from './core/synchronization/sync-status.service';
import { PageHeaderService } from './shared/components/page-header.service';
import { ActiveFairService } from './core/event/active-fair.service';
import { APP_ENVIRONMENT } from './core/configuration/environment.tokens';

@Component({
  imports: [RouterLink, RouterOutlet, ResponsiveNavComponent, MobileActionBarComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly appState = inject(AppStateService);
  protected readonly syncStatus = inject(SyncStatusService);
  protected readonly pageHeader = inject(PageHeaderService);
  protected readonly activeFair = inject(ActiveFairService);
  protected readonly environment = inject(APP_ENVIRONMENT);
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void { this.menuOpen.update((open) => !open); }
  protected closeMenu(): void { this.menuOpen.set(false); }
  protected trigger(): void {
    const actions = this.pageHeader.actions();
    if (actions.length === 1) { this.pageHeader.select(actions[0].key); return; }
    this.toggleMenu();
  }
  protected chooseAction(key: string): void {
    this.pageHeader.select(key);
    this.closeMenu();
  }
  protected changeHeaderFilter(event: Event): void {
    this.pageHeader.changeFilter((event.target as HTMLSelectElement).value);
  }
  protected async leaveForcedFairMode(): Promise<void> {
    const fair = this.activeFair.forcedFair();
    if (!fair || !window.confirm(`Uscire dalla modalità fiera forzata "${fair.name}"?`)) return;
    await this.activeFair.clearForcedFair();
  }
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    // Handle GitHub Pages SPA redirect from 404.html
    effect(() => {
      const queryParams = this.route.snapshot.queryParams;
      if (queryParams['redirect']) {
        const redirectPath = queryParams['redirect'];
        // Remove redirect param and navigate to the requested path
        this.router.navigateByUrl(redirectPath);
      }
    });
  }
}

