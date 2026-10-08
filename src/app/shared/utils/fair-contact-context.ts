import type { Fair } from '../../domain/models/fair';
import type { FairTaskContactRole } from '../../domain/models/fair-task';
import type { ContactSheetAction } from './contact-links';
import { buildMapsSearchUrl } from './maps-links';

/** Azioni derivate dal contesto fiera (non sono recapiti del Party): posizione della fiera sempre, prenotazione hotel solo per i contatti di ruolo Hotel. */
export function buildFairContextActions(fair: Fair | undefined, contactRole?: FairTaskContactRole): readonly ContactSheetAction[] {
  if (!fair) return [];
  const actions: ContactSheetAction[] = [];
  if (fair.location?.trim()) actions.push({ key: 'maps-fair', icon: '📍', label: `Posizione fiera · ${fair.location}`, href: buildMapsSearchUrl(fair.location), external: true, preferred: false });
  if (contactRole === 'hotel' && fair.hotelBookingUrl?.trim()) actions.push({ key: 'booking', icon: '🏨', label: 'Apri prenotazione hotel', href: fair.hotelBookingUrl, external: true, preferred: false });
  return actions;
}
