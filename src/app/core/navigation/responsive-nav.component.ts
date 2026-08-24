import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  ElementRef,
  signal,
  computed,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { APP_NAVIGATION_ITEMS, NavigationItem } from './app-navigation-config';

/**
 * Responsive navigation component for the sidebar.
 * Handles:
 * - Desktop: all items visible
 * - Tablet/Mobile: items that fit shown, excess in "More" menu
 * - Active state tracking
 * - Keyboard navigation and accessibility
 */
@Component({
  selector: 'app-responsive-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './responsive-nav.component.html',
  styleUrl: './responsive-nav.component.scss',
})
export class ResponsiveNavComponent implements OnInit {
  navigationItems = APP_NAVIGATION_ITEMS;
  moreMenuOpen = signal(false);

  // Track which items are visible (to be calculated based on available space)
  private visibleCount = signal(this.navigationItems.length);

  visibleItems: Signal<NavigationItem[]> = computed(() => {
    return this.navigationItems.slice(0, this.visibleCount());
  });

  hasMoreItems: Signal<boolean> = computed(() => {
    return this.visibleCount() < this.navigationItems.length;
  });

  @ViewChild('navContainer') navContainer!: ElementRef;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initial calculation of visible items
    this.calculateVisibleItems();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    // Recalculate visible items on window resize
    this.calculateVisibleItems();
  }

  /**
   * Calculate how many items can fit in the available space
   * This is a simplified approach - in production, you might use ResizeObserver
   */
  private calculateVisibleItems(): void {
    // Use a timeout to ensure DOM is updated before measuring
    setTimeout(() => {
      if (!this.navContainer) return;

      const container = this.navContainer.nativeElement as HTMLElement;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const itemHeight = 56; // ~height of a nav item based on CSS
      const availableHeight = window.innerHeight * 0.6; // Rough estimate

      // Calculate how many items can fit
      // This is based on sidebar width and item height
      // For sidebar layout (vertical), we don't need to hide items based on width
      // But we can hide based on viewport height if needed
      // For now, show all items if there's enough space
      const maxItems = Math.max(
        3,
        Math.floor(availableHeight / itemHeight),
      );
      this.visibleCount.set(
        Math.min(
          maxItems,
          this.navigationItems.length,
        ),
      );
    }, 0);
  }

  toggleMoreMenu(): void {
    this.moreMenuOpen.update((open) => !open);
  }

  closeMoreMenu(): void {
    this.moreMenuOpen.set(false);
  }

  trackByPath(_index: number, item: NavigationItem): string {
    return item.path;
  }
}
