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
  template: `
    <div class="responsive-nav-wrapper">
      <!-- Main navigation items -->
      <nav class="sidebar-nav" #navContainer>
        <a
          *ngFor="let item of visibleItems(); trackBy: trackByPath"
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.exact || false }"
          class="nav-item"
          [attr.aria-label]="item.label"
          [attr.data-path]="item.path"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </nav>

      <!-- More menu button (visible only when items are hidden) -->
      <button
        *ngIf="hasMoreItems()"
        class="nav-more-button"
        [class.active]="moreMenuOpen()"
        (click)="toggleMoreMenu()"
        aria-label="Mostra altri elementi di navigazione"
        aria-haspopup="menu"
        [attr.aria-expanded]="moreMenuOpen()"
      >
        <span class="more-icon">⋯</span>
        <span class="more-label">Altro</span>
      </button>

      <!-- More menu dropdown -->
      <div
        *ngIf="moreMenuOpen()"
        class="nav-more-menu"
        role="menu"
        @.presence
      >
        <div class="more-menu-header">
          <span>Altre opzioni</span>
          <button
            class="more-menu-close"
            (click)="closeMoreMenu()"
            aria-label="Chiudi menu"
          >
            ✕
          </button>
        </div>

        <!-- Show ALL items (including visible ones) in the more menu -->
        <nav class="more-menu-items">
          <a
            *ngFor="let item of navigationItems; trackBy: trackByPath"
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.exact || false }"
            class="more-menu-item"
            [attr.aria-label]="item.label"
            role="menuitem"
            (click)="closeMoreMenu()"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        </nav>
      </div>
    </div>
  `,
  styles: `
    .responsive-nav-wrapper {
      position: relative;
      width: 100%;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
      padding: var(--spacing-4);
      color: var(--color-text-primary);
      text-decoration: none;
      border-radius: var(--radius-base);
      border-left: 3px solid transparent;
      transition: all var(--transition-base);
      font-size: var(--font-size-base);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-item:hover {
      background-color: var(--color-surface-tertiary);
    }

    .nav-item:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .nav-item.active {
      background-color: var(--color-surface-tertiary);
      border-left-color: var(--color-accent);
      font-weight: var(--font-weight-semibold);
    }

    .nav-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      flex-shrink: 0;
      font-size: var(--font-size-lg);
    }

    .nav-label {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* More button */
    .nav-more-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-2);
      padding: var(--spacing-4);
      background: none;
      border: none;
      color: var(--color-text-primary);
      font-size: var(--font-size-xs);
      cursor: pointer;
      border-radius: var(--radius-base);
      border-left: 3px solid transparent;
      transition: all var(--transition-base);
      min-height: 3rem;
    }

    .nav-more-button:hover {
      background-color: var(--color-surface-tertiary);
    }

    .nav-more-button:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .nav-more-button.active {
      background-color: var(--color-surface-tertiary);
      border-left-color: var(--color-accent);
    }

    .more-icon {
      font-size: var(--font-size-xl);
      font-weight: bold;
    }

    .more-label {
      white-space: nowrap;
    }

    /* More menu dropdown */
    .nav-more-menu {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      top: -999px;
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-base);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      max-height: 80vh;
      overflow-y: auto;
      animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .more-menu-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-4) var(--spacing-6);
      border-bottom: 1px solid var(--color-border);
      font-weight: var(--font-weight-semibold);
      flex-shrink: 0;
    }

    .more-menu-close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-primary);
      font-size: var(--font-size-lg);
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform var(--transition-base);
    }

    .more-menu-close:hover {
      transform: scale(1.2);
    }

    .more-menu-items {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .more-menu-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
      padding: var(--spacing-4) var(--spacing-6);
      color: var(--color-text-primary);
      text-decoration: none;
      transition: all var(--transition-base);
      border-left: 3px solid transparent;
      font-size: var(--font-size-base);
    }

    .more-menu-item:hover {
      background-color: var(--color-surface-tertiary);
    }

    .more-menu-item:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: -2px;
    }

    .more-menu-item.active {
      background-color: var(--color-surface-tertiary);
      border-left-color: var(--color-accent);
      font-weight: var(--font-weight-semibold);
    }

    /* Mobile adjustments */
    @media (max-width: 699px) {
      .sidebar-nav,
      .nav-more-button {
        display: none;
      }

      .nav-more-menu {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        top: auto;
        border-radius: 0;
        max-height: 70vh;
      }
    }
  `,
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
