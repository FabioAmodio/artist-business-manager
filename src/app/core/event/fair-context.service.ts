import { Injectable, computed, signal } from '@angular/core';
import type { AiTransparencySettings, Fair, FairCost, FairSale } from '../../domain/event/event-types';

export interface FairDashboard {
  readonly fair: Fair | null;
  readonly daysRemaining: number | null;
  readonly todaySales: number;
  readonly cumulativeSales: number;
  readonly saleCount: number;
  readonly totalCosts: number;
  readonly uncoveredCosts: number;
  readonly profit: number;
}

@Injectable({ providedIn: 'root' })
export class FairContextService {
  private readonly fairs = signal<readonly Fair[]>([]);
  private readonly costs = signal<readonly FairCost[]>([]);
  private readonly sales = signal<readonly FairSale[]>([]);
  private readonly today = signal(new Date());
  private readonly aiSettings = signal<AiTransparencySettings>({
    enabled: false,
    consentGiven: false,
    allowCloudProcessing: false,
  });

  readonly activeFair = computed(() => {
    const currentDate = this.toDateKey(this.today());
    return this.fairs().find((fair) => fair.startDate <= currentDate && currentDate <= fair.endDate) ?? null;
  });

  readonly fairModeActive = computed(() => this.activeFair() !== null);
  readonly transparencySettings = this.aiSettings.asReadonly();

  readonly dashboard = computed<FairDashboard>(() => {
    const fair = this.activeFair();
    if (!fair) {
      return { fair: null, daysRemaining: null, todaySales: 0, cumulativeSales: 0, saleCount: 0, totalCosts: 0, uncoveredCosts: 0, profit: 0 };
    }

    const fairSales = this.sales().filter((sale) => sale.fairId === fair.id);
    const fairCosts = this.costs().filter((cost) => cost.fairId === fair.id);
    const cumulativeSales = fairSales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalCosts = fairCosts.reduce((sum, cost) => sum + (cost.actualAmount ?? cost.plannedAmount), 0);
    const todayKey = this.toDateKey(this.today());
    const todaySales = fairSales
      .filter((sale) => sale.occurredAt.slice(0, 10) === todayKey)
      .reduce((sum, sale) => sum + sale.amount, 0);

    return {
      fair,
      daysRemaining: Math.max(0, this.daysBetween(todayKey, fair.endDate)),
      todaySales,
      cumulativeSales,
      saleCount: fairSales.length,
      totalCosts,
      uncoveredCosts: Math.max(0, totalCosts - cumulativeSales),
      profit: cumulativeSales - totalCosts,
    };
  });

  setFairs(fairs: readonly Fair[]): void { this.fairs.set(fairs); }
  setCosts(costs: readonly FairCost[]): void { this.costs.set(costs); }
  setSales(sales: readonly FairSale[]): void { this.sales.set(sales); }
  setToday(date: Date): void { this.today.set(date); }
  updateAiSettings(settings: AiTransparencySettings): void { this.aiSettings.set(settings); }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private daysBetween(from: string, to: string): number {
    return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
  }
}
