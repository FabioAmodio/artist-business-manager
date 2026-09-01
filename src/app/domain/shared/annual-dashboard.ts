import type { Bundle } from '../models/bundle';
import type { Fair } from '../models/fair';
import type { Operation } from '../models/operation';
import type { Payment } from '../models/payment';
import type { Product } from '../models/product';
import type { Purchase } from '../models/purchase';
import type { Service } from '../models/service';

export interface AnnualDashboardMetrics {
  readonly works: {
    readonly requested: number;
    readonly inProgress: number;
    readonly toDeliver: number;
    readonly unpaid: number;
    readonly annualTotal: number;
  };
  readonly fairs: {
    readonly completed: number;
    readonly balance: number;
    readonly upcoming: number;
    readonly next: Fair | null;
  };
  readonly finance: {
    readonly expenses: number;
    readonly purchaseExpenses: number;
    readonly fairExpenses: number;
    readonly income: number;
    readonly fairIncome: number;
    readonly nonFairIncome: number;
    readonly reimbursements: number;
    readonly balance: number;
    readonly revenueDetails: readonly { readonly key: string; readonly label: string; readonly amount: number }[];
  };
}

export interface AnnualDashboardSource {
  readonly operations: readonly Operation[];
  readonly payments: readonly Payment[];
  readonly fairs: readonly Fair[];
  readonly purchases: readonly Purchase[];
  readonly products: readonly Product[];
  readonly services: readonly Service[];
  readonly bundles: readonly Bundle[];
}

export function availableYearRange(source: AnnualDashboardSource, currentYear: number): { readonly min: number; readonly max: number } {
  const years = [
    currentYear,
    ...source.operations.map((operation) => yearOf(operation.operationDate ?? operation.createdAt)),
    ...source.purchases.map((purchase) => yearOf(purchase.purchaseDate)),
    ...source.fairs.map((fair) => yearOf(fair.startDate)),
  ].filter((year): year is number => year !== undefined);
  return { min: Math.min(...years), max: Math.max(...years) };
}

export function annualDashboardMetrics(source: AnnualDashboardSource, year: number, today: string): AnnualDashboardMetrics {
  const yearOperations = source.operations.filter((operation) => yearOf(operation.operationDate ?? operation.createdAt) === year);
  const workOperations = source.operations.filter((operation) => operation.workStatus !== undefined);
  const openWorks = workOperations.filter((operation) => operation.workStatus !== 'delivered' && operation.workStatus !== 'cancelled');
  const paymentTotals = paymentTotalsByOperation(source.payments);
  const operationById = new Map(source.operations.map((operation) => [operation.id, operation]));
  const yearFairs = source.fairs.filter((fair) => yearOf(fair.startDate) === year);
  const parentSales = yearOperations.filter((operation) => !operation.parentOperationId && (operation.type === 'sale' || operation.type === 'bundle'));
  const fairSales = parentSales.filter((operation) => operation.fairEditionId);
  const nonFairSales = parentSales.filter((operation) => !operation.fairEditionId);
  const purchaseExpenses = source.purchases.filter((purchase) => yearOf(purchase.purchaseDate) === year).reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  const fairExpenses = yearFairs.reduce((sum, fair) => sum + fairCosts(fair), 0);
  const reimbursements = yearFairs.reduce((sum, fair) => sum + (fair.reimbursement ?? 0), 0);
  const fairSalesIncome = sumAmounts(fairSales);
  const nonFairIncome = sumAmounts(nonFairSales);
  const fairIncome = fairSalesIncome + reimbursements;
  const income = fairIncome + nonFairIncome;
  const expenses = purchaseExpenses + fairExpenses;

  return {
    works: {
      requested: openWorks.filter((operation) => operation.workStatus === 'requested').length,
      inProgress: openWorks.filter((operation) => operation.workStatus === 'in-progress').length,
      toDeliver: openWorks.filter((operation) => operation.workStatus === 'completed').length,
      unpaid: openWorks.filter((operation) => effectivePaid(operation, operationById, paymentTotals) + 0.005 < (operation.amount ?? 0)).length,
      annualTotal: yearOperations.filter((operation) => operation.workStatus !== undefined).length,
    },
    fairs: {
      completed: yearFairs.filter((fair) => fair.endDate < today).length,
      balance: fairIncome - fairExpenses,
      upcoming: yearFairs.filter((fair) => fair.startDate > today).length,
      next: yearFairs.filter((fair) => fair.startDate > today).sort((first, second) => first.startDate.localeCompare(second.startDate))[0] ?? null,
    },
    finance: {
      expenses,
      purchaseExpenses,
      fairExpenses,
      income,
      fairIncome,
      nonFairIncome,
      reimbursements,
      balance: income - expenses,
      revenueDetails: revenueDetails(parentSales, source.products, source.services, source.bundles),
    },
  };
}

function revenueDetails(operations: readonly Operation[], products: readonly Product[], services: readonly Service[], bundles: readonly Bundle[]): readonly { readonly key: string; readonly label: string; readonly amount: number }[] {
  const labels = new Map<string, string>([
    ...products.map((product) => [`product:${product.id}`, product.name] as const),
    ...services.map((service) => [`service:${service.id}`, service.description] as const),
    ...bundles.map((bundle) => [`bundle:${bundle.id}`, bundle.name] as const),
  ]);
  const totals = new Map<string, { label: string; amount: number }>();
  for (const operation of operations) {
    const key = operation.productId ? `product:${operation.productId}` : operation.serviceId ? `service:${operation.serviceId}` : operation.bundleId ? `bundle:${operation.bundleId}` : 'other';
    const current = totals.get(key);
    totals.set(key, { label: labels.get(key) ?? (operation.type === 'bundle' ? operation.title || 'Pacchetto' : 'Altro'), amount: (current?.amount ?? 0) + (operation.amount ?? 0) });
  }
  return [...totals.entries()].map(([key, detail]) => ({ key, ...detail })).sort((first, second) => second.amount - first.amount);
}

function effectivePaid(operation: Operation, operationById: ReadonlyMap<string, Operation>, paymentTotals: ReadonlyMap<string, number>): number {
  if (!operation.parentOperationId) return paymentTotals.get(operation.id) ?? 0;
  const parent = operationById.get(operation.parentOperationId);
  if (!parent || (parent.amount ?? 0) <= 0) return paymentTotals.get(operation.id) ?? 0;
  return Math.min(operation.amount ?? 0, (paymentTotals.get(parent.id) ?? 0) * (operation.amount ?? 0) / parent.amount!);
}

function paymentTotalsByOperation(payments: readonly Payment[]): ReadonlyMap<string, number> {
  const totals = new Map<string, number>();
  for (const payment of payments) totals.set(payment.operationId, (totals.get(payment.operationId) ?? 0) + payment.amount);
  return totals;
}

function fairCosts(fair: Fair): number { return (fair.standCost ?? 0) + (fair.travelCost ?? 0) + (fair.hotelCost ?? 0) + (fair.otherCosts ?? 0); }
function sumAmounts(operations: readonly Operation[]): number { return operations.reduce((sum, operation) => sum + (operation.amount ?? 0), 0); }
function yearOf(value: string | undefined): number | undefined { const year = value?.slice(0, 4); return year && /^\d{4}$/.test(year) ? Number(year) : undefined; }