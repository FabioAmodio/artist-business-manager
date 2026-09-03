import type { AnnualDashboardSource } from './annual-dashboard';
import { annualDashboardMetrics, availableYearRange } from './annual-dashboard';

const source = {
  operations: [
    { id: 'sale-fair', type: 'sale', title: 'Stampa', amount: 100, fairEditionId: 'fair-1', productId: 'product-1', operationDate: '2026-06-01T10:00:00Z', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
    { id: 'bundle', type: 'bundle', title: 'Pacchetto', bundleId: 'bundle-1', amount: 50, operationDate: '2026-06-02T10:00:00Z', createdAt: '2026-06-02T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
    { id: 'bundle-work', parentOperationId: 'bundle', type: 'work', title: 'Sketch', amount: 20, workStatus: 'in-progress', operationDate: '2026-06-02T10:00:00Z', createdAt: '2026-06-02T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
    { id: 'bundle-work-2', parentOperationId: 'bundle', type: 'work', title: 'Colorazione', amount: 30, workStatus: 'completed', operationDate: '2026-06-02T10:00:00Z', createdAt: '2026-06-02T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
    { id: 'completed-work', type: 'work', title: 'Commission', amount: 30, workStatus: 'completed', operationDate: '2026-05-01T10:00:00Z', createdAt: '2026-05-01T10:00:00Z', updatedAt: '2026-05-01T10:00:00Z' },
    { id: 'delivered-work', type: 'work', title: 'Consegnato', amount: 40, workStatus: 'delivered', operationDate: '2026-04-01T10:00:00Z', createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
    { id: 'older-work', type: 'work', title: 'Storico aperto', amount: 15, workStatus: 'requested', operationDate: '2025-12-01T10:00:00Z', createdAt: '2025-12-01T10:00:00Z', updatedAt: '2025-12-01T10:00:00Z' },
  ],
  payments: [{ id: 'payment-1', operationId: 'bundle', amount: 25, paymentDate: '2026-06-02', paymentMethodId: 'cash', createdAt: '2026-06-02T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' }],
  fairs: [{ id: 'fair-1', fairSeriesId: 'series-1', edition: '2026', name: 'Fiera', location: 'Roma', startDate: '2026-06-01', endDate: '2026-06-02', standCost: 20, reimbursement: 5, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
  purchases: [{ id: 'purchase-1', purchaseDate: '2026-03-01', description: 'Stampe', totalAmount: 30, createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' }],
  products: [{ id: 'product-1', name: 'Stampa', active: true, tags: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
  services: [],
  bundles: [{ id: 'bundle-1', name: 'Pacchetto', active: true, items: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
} satisfies AnnualDashboardSource;

describe('annual dashboard', () => {
  it('aggregates work, fair and finance metrics without counting bundle children as revenue', () => {
    const metrics = annualDashboardMetrics(source, 2026, '2026-09-01');

    expect(metrics.works).toEqual({ requested: 1, inProgress: 1, toDeliver: 2, unpaid: 3, annualTotal: 4 });
    expect(metrics.fairs).toMatchObject({ completed: 1, balance: 85, upcoming: 0, next: null });
    expect(metrics.finance).toMatchObject({ expenses: 50, purchaseExpenses: 30, fairExpenses: 20, income: 155, fairIncome: 105, nonFairIncome: 50, reimbursements: 5, balance: 105 });
    expect(metrics.finance.revenueDetails).toEqual([{ key: 'product:product-1', label: 'Stampa', amount: 100 }, { key: 'bundle:bundle-1', label: 'Pacchetto', amount: 50 }]);
  });

  it('derives inclusive year bounds from registered data and the current year', () => {
    expect(availableYearRange(source, 2027)).toEqual({ min: 2025, max: 2027 });
  });
});