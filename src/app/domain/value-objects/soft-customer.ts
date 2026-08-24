import type { EntityId } from '../shared/types';

export interface SoftCustomer {
  readonly freeName: string;
  readonly contactHint?: string;
  readonly convertibleToPartyId?: EntityId;
}
