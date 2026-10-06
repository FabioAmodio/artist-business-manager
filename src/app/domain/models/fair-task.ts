import type { EntityId, IsoDateTime } from '../shared/types';
import type { FairTaskKind } from './fair';
import type { PartyContactChannel } from './party';

export type FairTaskStatus = 'pending' | 'done' | 'not-needed';
/** Tipo di contatto da proporre nella checklist: le combo non mischiano mai organizzatori e hotel. */
export type FairTaskContactRole = 'organizer' | 'hotel';

export interface FairTask {
  readonly id: EntityId;
  readonly fairEditionId: EntityId;
  readonly kind: FairTaskKind;
  readonly title: string;
  /** Determina quale elenco di contatti (ruolo Party) proporre per questa attivita. */
  readonly contactRole?: FairTaskContactRole;
  /** Contatto Party collegato (ADR-008): preferito rispetto al testo libero sottostante. */
  readonly partyId?: EntityId;
  /** Canale scelto tra quelli disponibili sul Party collegato (email/telefono/whatsapp/sito). */
  readonly contactChannel?: PartyContactChannel;
  /** Recapito specifico tra quelli dello stesso canale (es. due email): se assente si usa il campo principale del Party per quel canale. */
  readonly contactMethodId?: EntityId;
  /** Testo libero facoltativo (nome, telefono, email...): fallback quando non e collegato un Party. */
  readonly contactInfo?: string;
  readonly dueDate?: string;
  readonly status: FairTaskStatus;
  /** Data dell'ultimo cambio di stato: utile per risalire a quando un punto e stato segnato (es. invio mail). */
  readonly statusChangedAt?: IsoDateTime;
  readonly notes?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
