import type { EntityId, IsoDateTime } from '../shared/types';

export interface Product {
  readonly id: EntityId;
  readonly name: string;
  readonly description?: string;
  readonly suggestedPrice?: number;
  readonly active: boolean;
  readonly tags: readonly string[];
  /** Lotto proposto di default quando si collega un acquisto da questo prodotto. */
  readonly defaultLotId?: EntityId;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
