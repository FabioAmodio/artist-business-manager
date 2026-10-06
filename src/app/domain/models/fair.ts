import type { EntityId, IsoDateTime } from '../shared/types';

export type FairTaskKind =
  | 'contact-organizer'
  | 'await-reply'
  | 'send-application'
  | 'pay-fee'
  | 'send-promo-material'
  | 'book-hotel'
  | 'hotel-cancellation-deadline'
  | 'custom';

export interface FairSeriesTaskTemplateItem {
  readonly kind: FairTaskKind;
  readonly title: string;
  readonly defaultStatus?: 'pending' | 'not-needed';
  readonly defaultNotes?: string;
}

export interface FairSeries {
  readonly id: EntityId;
  readonly name: string;
  /** Organizzatore collegato all'anagrafica Party (ADR-008): preferito rispetto ai campi legacy sottostanti. */
  readonly organizerPartyId?: EntityId;
  /** @deprecated Usare organizerPartyId. Mantenuti per record legacy e fallback senza anagrafica collegata. */
  readonly organizerName?: string;
  readonly organizerContact?: string;
  readonly organizerEmail?: string;
  readonly organizerPhone?: string;
  readonly website?: string;
  readonly defaultLocation?: string;
  readonly notes?: string;
  readonly taskTemplate?: readonly FairSeriesTaskTemplateItem[];
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}

export type FairEditionStatus = 'draft' | 'confirmed' | 'cancelled';

export interface FairEdition {
  readonly id: EntityId;
  readonly fairSeriesId: EntityId;
  readonly edition: string;
  /** @deprecated Use edition. Kept for legacy records and reporting migration. */
  readonly year?: number;
  readonly name: string;
  readonly location: string;
  readonly locationNotes?: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: FairEditionStatus;
  readonly expectedBudget?: number;
  readonly standCost?: number;
  readonly reimbursement?: number;
  readonly hotelCost?: number;
  readonly travelCost?: number;
  readonly otherCosts?: number;
  readonly standPaid?: boolean;
  readonly travelPaid?: boolean;
  readonly hotelPaid?: boolean;
  readonly notes?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}

/** Compatibility alias: existing Fair consumers now represent a FairEdition. */
export type Fair = FairEdition;
