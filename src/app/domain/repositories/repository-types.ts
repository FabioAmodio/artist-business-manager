import type { EntityId } from '../shared/types';

export interface EntityFilter {
  readonly includeDeleted?: boolean;
  readonly text?: string;
}

export type OperationFilter = EntityFilter & { readonly type?: string };
export type FairFilter = EntityFilter & { readonly from?: string; readonly to?: string };
export type FairSeriesFilter = EntityFilter;
export type LotFilter = EntityFilter & { readonly productId?: EntityId; readonly purchaseId?: EntityId };
export type ProductFilter = EntityFilter & { readonly active?: boolean };
export type PurchaseFilter = EntityFilter & { readonly supplierId?: EntityId };
export type PaymentMethodFilter = EntityFilter;
export type ServiceFilter = EntityFilter;

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
