import type { EntityId, IsoDateTime } from '../shared/types';
import type { PartyContactChannel } from './party';

/** Entita' a cui si riferisce la voce: oggi solo fiere, pensato per essere riusato da altre feature in futuro. */
export type ActivityLogSubjectType = 'fair';

export interface ActivityLogEntry {
  readonly id: EntityId;
  readonly subjectType: ActivityLogSubjectType;
  readonly subjectId: EntityId;
  /** Data dell'azione (editabile): non coincide necessariamente con createdAt. */
  readonly date: string;
  readonly title: string;
  readonly contactName?: string;
  readonly contactChannel?: PartyContactChannel;
  readonly contactValue?: string;
  readonly notes?: string;
  /** Traccia il task che ha generato automaticamente la voce: solo informativo, nessuna cascata su rinomina/cancellazione del task. */
  readonly sourceTaskId?: EntityId;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
