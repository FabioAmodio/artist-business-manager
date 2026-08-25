import type { EntityId, IsoDateTime } from '../shared/types';

export type PartyRole = 'customer' | 'commissioner' | 'publisher' | 'supplier' | 'collaborator';
export type SupplierType = 'printer' | 'publisher' | 'materials' | 'marketplace' | 'other';

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
  readonly notes?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
