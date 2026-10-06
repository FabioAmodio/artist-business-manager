import type { EntityId, IsoDateTime } from '../shared/types';

export type PartyRole = 'customer' | 'publisher' | 'supplier' | 'collaborator' | 'organizer' | 'hotel';
export type SupplierType = 'printer' | 'publisher' | 'materials' | 'marketplace' | 'other';
export type PartyContactChannel = 'email' | 'phone' | 'whatsapp' | 'website';

export interface PartyContactMethod {
  readonly id: EntityId;
  readonly channel: PartyContactChannel;
  readonly value: string;
  /** Es. "Ufficio", "Cellulare personale": distingue piu recapiti dello stesso canale. */
  readonly label?: string;
}

export interface Party {
  readonly id: EntityId;
  readonly type: 'person' | 'organization';
  readonly displayName: string;
  readonly roles?: readonly PartyRole[];
  readonly supplierType?: SupplierType;
  readonly email?: string;
  readonly phone?: string;
  readonly website?: string;
  readonly social?: string;
  /** Recapiti aggiuntivi oltre a email/phone/website principali (es. secondo telefono, WhatsApp diverso dal numero principale). */
  readonly contacts?: readonly PartyContactMethod[];
  readonly notes?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}

