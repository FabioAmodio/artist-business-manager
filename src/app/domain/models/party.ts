import type { EntityId, IsoDateTime } from '../shared/types';

export type PartyRole = 'customer' | 'publisher' | 'supplier' | 'collaborator' | 'organizer' | 'hotel';
export type SupplierType = 'printer' | 'publisher' | 'materials' | 'marketplace' | 'other';
/** 'website' e i social sono sempre su valore singolo (link/handle), mai derivati da altri campi come whatsapp lo e' dal telefono. 'address' e' testo libero aperto su Google Maps. */
export type PartyContactChannel = 'email' | 'phone' | 'whatsapp' | 'website' | 'address' | 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'telegram' | 'linkedin' | 'youtube' | 'threads' | 'pinterest';

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
  /** Sito web e social (Facebook, Instagram, ecc.) sono recapiti strutturati in 'contacts', non piu campi principali: mai usati come tali nei dati reali. */
  readonly contacts?: readonly PartyContactMethod[];
  /** Canale di contatto evidenziato come preferito nell'azione rapida "Contatta" (es. 'phone'); undefined = nessuna preferenza. */
  readonly preferredContactChannel?: PartyContactChannel;
  /** Id del PartyContactMethod preferito quando non e' il campo principale del Party per quel canale. */
  readonly preferredContactMethodId?: EntityId;
  readonly notes?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}

