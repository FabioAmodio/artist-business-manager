import type { EntityId, IsoDateTime } from '../shared/types';

export type BundleItemCatalogKind = 'product' | 'service';

export interface BundleItem {
  readonly id: EntityId;
  readonly catalogKind: BundleItemCatalogKind;
  readonly catalogId: EntityId;
  readonly quantity: number;
  readonly percentage?: number;
}

export interface BundleItemInput extends Omit<BundleItem, 'id'> {
  readonly id?: EntityId;
}

export interface Bundle {
  readonly id: EntityId;
  readonly name: string;
  readonly description?: string;
  readonly active: boolean;
  readonly bundlePrice?: number;
  readonly items: readonly BundleItem[];
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}

export type BundleInput = Pick<Bundle, 'name' | 'description' | 'active' | 'bundlePrice'> & {
  readonly items: readonly BundleItemInput[];
};

export interface BundleItemResolvedAmount extends BundleItem {
  readonly amount: number;
  readonly name: string;
}
