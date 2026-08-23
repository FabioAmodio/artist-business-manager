import type { EntityId, IsoDateTime } from '../shared/types';

export type FairCostType = 'stand' | 'travel' | 'accommodation' | 'other';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';
export type ContentOrigin = 'manual' | 'ai-assisted' | 'ai-generated' | 'calculated';

export interface Fair {
  readonly id: EntityId;
  readonly name: string;
  readonly location: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly notes?: string;
}

export interface FairCost {
  readonly id: EntityId;
  readonly fairId: EntityId;
  readonly type: FairCostType;
  readonly label: string;
  readonly plannedAmount: number;
  readonly actualAmount?: number;
}

export interface FairSale {
  readonly id: EntityId;
  readonly fairId: EntityId;
  readonly amount: number;
  readonly occurredAt: IsoDateTime;
  readonly paymentMethod: PaymentMethod;
}

export interface AiProvenance {
  readonly origin: ContentOrigin;
  readonly createdAt: IsoDateTime;
  readonly reviewedByUser: boolean;
  readonly model?: string;
  readonly promptVersion?: string;
}

export interface AiTransparencySettings {
  readonly enabled: boolean;
  readonly consentGiven: boolean;
  readonly allowCloudProcessing: boolean;
}
