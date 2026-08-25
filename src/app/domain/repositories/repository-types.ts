import type { EntityId } from '../shared/types';

export interface EntityFilter {
  readonly includeDeleted?: boolean;
  readonly text?: string;
}

export type OperationFilter = EntityFilter & { readonly type?: string };
export type FairFilter = EntityFilter & { readonly from?: string; readonly to?: string };
export type FairSeriesFilter = EntityFilter;
export type ProductFilter = EntityFilter;
export type PurchaseFilter = EntityFilter & { readonly supplierId?: EntityId };

export interface OperationTransition {
  readonly status: string;
  readonly reason?: string;
}

export interface OperationCompletionPatch {
  readonly missingFields: readonly string[];
}

export interface BundleConfiguration {
  readonly bundleId: EntityId;
}
