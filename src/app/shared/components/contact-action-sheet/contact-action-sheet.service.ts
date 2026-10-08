import { Injectable, signal } from '@angular/core';
import type { Party } from '../../../domain/models/party';
import type { ContactSheetAction } from '../../utils/contact-links';

@Injectable({ providedIn: 'root' })
export class ContactActionSheetService {
  readonly party = signal<Party | null>(null);
  /** Azioni derivate dal contesto (es. posizione fiera, prenotazione hotel) mostrate in coda ai recapiti del Party. */
  readonly extraActions = signal<readonly ContactSheetAction[]>([]);

  open(party: Party, extraActions: readonly ContactSheetAction[] = []): void {
    this.party.set(party);
    this.extraActions.set(extraActions);
  }
  close(): void { this.party.set(null); this.extraActions.set([]); }
}
