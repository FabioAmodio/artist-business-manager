import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { APP_NAVIGATION_ITEMS, NavigationItem } from './app-navigation-config';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-mobile-action-bar',
  templateUrl: './mobile-action-bar.component.html',
  styleUrl: './mobile-action-bar.component.scss',
})
export class MobileActionBarComponent {
  private readonly router = inject(Router);
  protected readonly moreMenuOpen = signal(false);
  protected readonly secondaryItems: readonly NavigationItem[] = APP_NAVIGATION_ITEMS.filter((item) => !['/dashboard', '/events', '/catalog', '/lots'].includes(item.path));

  protected openQuickAction(): void {
    void this.router.navigate(['/sales'], { queryParams: { create: Date.now().toString() } });
  }

  protected toggleMoreMenu(): void { this.moreMenuOpen.update((open) => !open); }
  protected closeMoreMenu(): void { this.moreMenuOpen.set(false); }
}
