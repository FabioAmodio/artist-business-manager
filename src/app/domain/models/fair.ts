import type { EntityId, IsoDateTime } from '../shared/types';

export interface FairSeries {
  readonly id: EntityId;
  readonly name: string;
  readonly organizerName?: string;
  readonly organizerContact?: string;
  readonly organizerEmail?: string;
  readonly organizerPhone?: string;
  readonly website?: string;
  readonly defaultLocation?: string;
  readonly notes?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}

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
  readonly notes?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}

/** Compatibility alias: existing Fair consumers now represent a FairEdition. */
export type Fair = FairEdition;
