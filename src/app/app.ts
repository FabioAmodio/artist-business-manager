import { Component, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { NavigationEnd, RouterLink, RouterOutlet, Router } from '@angular/router';
import { filter, take } from 'rxjs';
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
  protected readonly pullDistance = signal(0);
  protected readonly refreshing = signal(false);
  protected readonly updateAvailable = signal(false);
  private pullStartY: number | null = null;
  private readonly pullThreshold = 48;

  private readonly swUpdate = inject(SwUpdate);

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
  protected handlePullStart(event: TouchEvent): void {
    if (window.innerWidth >= 700 || this.refreshing() || this.isDialogOpen() || event.touches.length !== 1) return;
    const content = event.currentTarget as HTMLElement;
    this.pullStartY = content.scrollTop <= 0 ? event.touches[0].clientY : null;
  }
  protected handlePullMove(event: TouchEvent): void {
    if (this.pullStartY === null || this.refreshing() || this.isDialogOpen() || event.touches.length !== 1) return;
    const distance = event.touches[0].clientY - this.pullStartY;
    if (distance <= 0) {
      this.pullDistance.set(0);
      return;
    }
    event.preventDefault();
    this.pullDistance.set(Math.min(distance * 0.65, 84));
  }
  protected handlePullEnd(): void {
    if (this.pullStartY === null) return;
    const shouldRefresh = this.pullDistance() >= this.pullThreshold;
    this.pullStartY = null;
    if (this.isDialogOpen()) {
      this.pullDistance.set(0);
      return;
    }
    if (!shouldRefresh) {
      this.pullDistance.set(0);
      return;
    }
    this.refreshing.set(true);
    this.pullDistance.set(48);
    window.location.reload();
  }
  protected async leaveForcedFairMode(): Promise<void> {
    const fair = this.activeFair.forcedFair();
    if (!fair || !window.confirm(`Uscire dalla modalità fiera forzata "${fair.name}"?`)) return;
    await this.activeFair.clearForcedFair();
  }
  protected async updateApp(): Promise<void> {
    if (!this.swUpdate.isEnabled) return;
    await this.swUpdate.activateUpdate();
    window.location.reload();
  }

  private isDialogOpen(): boolean { return document.querySelector('[role="dialog"]') !== null; }

  constructor(
    private readonly router: Router,
  ) {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') this.updateAvailable.set(true);
      });
    }
    // Handle GitHub Pages SPA redirect from 404.html
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd), take(1)).subscribe((event) => {
      const queryParams = this.router.parseUrl(event.urlAfterRedirects).queryParams;
      const redirectPath = queryParams['redirect'];
      if (typeof redirectPath === 'string' && redirectPath) this.router.navigateByUrl(redirectPath, { replaceUrl: true });
    });
  }
}

