import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { APP_NAVIGATION_ITEMS, NavigationItem } from './app-navigation-config';
import { AppStateService } from '../state/app-state.service';
import { PersistenceService } from '../../application/persistence/persistence.service';
import { FirebaseAuthService } from '../firebase/firebase-auth.service';
import { SyncStatusService } from '../synchronization/sync-status.service';
import { ActiveFairService } from '../event/active-fair.service';
import { FairContactsDialogService } from '../../shared/components/fair-contacts-dialog/fair-contacts-dialog.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-mobile-action-bar',
  templateUrl: './mobile-action-bar.component.html',
  styleUrl: './mobile-action-bar.component.scss',
})
export class MobileActionBarComponent {
  private readonly router = inject(Router);
  protected readonly appState = inject(AppStateService);
  protected readonly persistence = inject(PersistenceService);
  protected readonly firebaseAuth = inject(FirebaseAuthService);
  protected readonly syncStatus = inject(SyncStatusService);
  protected readonly activeFair = inject(ActiveFairService);
  private readonly fairContactsDialog = inject(FairContactsDialogService);
  protected readonly moreMenuOpen = signal(false);
  // In modalita fiera "Contatti" sostituisce Catalogo nella toolbar: Catalogo torna nel menu "Altro" insieme a Scadenze.
  protected readonly secondaryItems = computed<readonly NavigationItem[]>(() => {
    const hidden = new Set(['/dashboard', '/events', '/lots', '/deadlines']);
    return APP_NAVIGATION_ITEMS.filter((item) => !hidden.has(item.path));
  });

  protected openQuickAction(): void {
    void this.router.navigate(['/sales'], { queryParams: { create: Date.now().toString() } });
  }

  protected openFairContacts(): void { this.fairContactsDialog.open(); }

  protected toggleMoreMenu(): void { this.moreMenuOpen.update((open) => !open); }
  protected closeMoreMenu(): void { this.moreMenuOpen.set(false); }
  protected syncLabel(): string {
    if (this.persistence.mode() === 'offline') return 'Solo locale';
    if (!this.firebaseAuth.initialized()) return 'Firebase in verifica';
    if (!this.firebaseAuth.user()) return 'Firebase non autenticato';
    switch (this.syncStatus.status()) {
      case 'pending': return 'Modifiche in attesa';
      case 'syncing': return 'Sincronizzazione in corso';
      case 'error': return 'Errore sincronizzazione';
      default: return 'Firebase allineato';
    }
  }
  protected dataModeOnline(): boolean { return this.persistence.mode() === 'firestore'; }
  protected syncIndicatorClass(): string {
    if (this.persistence.mode() === 'offline') return 'local';
    if (!this.firebaseAuth.initialized() || !this.firebaseAuth.user()) return 'remote-error';
    if (this.syncStatus.status() === 'syncing' || this.syncStatus.status() === 'pending') return 'remote-syncing';
    if (this.syncStatus.status() === 'error') return 'remote-error';
    return 'remote-synced';
  }
}
