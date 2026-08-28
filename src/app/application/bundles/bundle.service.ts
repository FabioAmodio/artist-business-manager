import { Injectable, inject } from '@angular/core';
import { BundleRepository } from '../../core/repositories/bundle.repository';
import type { Bundle, BundleInput, BundleItemInput, BundleItemResolvedAmount } from '../../domain/models/bundle';

@Injectable({ providedIn: 'root' })
export class BundleService {
  private readonly repository = inject(BundleRepository);

  list(query = ''): Promise<readonly Bundle[]> {
    return this.repository.list({ text: query || undefined });
  }

  async getById(id: string): Promise<Bundle | null> {
    return this.repository.getById(id);
  }

  async create(input: BundleInput): Promise<Bundle> {
    this.validate(input);
    const now = new Date().toISOString();
    const bundle: Bundle = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim(),
      active: input.active,
      bundlePrice: input.bundlePrice,
      items: input.items.map((item) => ({
        ...item,
        id: item.id ?? crypto.randomUUID(),
        quantity: Math.max(1, Number(item.quantity ?? 1)),
        percentage: item.percentage == null ? undefined : Number(item.percentage),
      })),
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.save(bundle);
    return bundle;
  }

  async update(id: string, input: BundleInput): Promise<Bundle> {
    this.validate(input);
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Pacchetto non trovato.');
    const bundle: Bundle = {
      ...existing,
      name: input.name.trim(),
      description: input.description?.trim(),
      active: input.active,
      bundlePrice: input.bundlePrice,
      items: input.items.map((item) => ({
        ...item,
        id: item.id ?? crypto.randomUUID(),
        quantity: Math.max(1, Number(item.quantity ?? 1)),
        percentage: item.percentage == null ? undefined : Number(item.percentage),
      })),
      updatedAt: new Date().toISOString(),
    };
    await this.repository.save(bundle);
    return bundle;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  resolveItemAmounts(bundle: Bundle, productLookup: Map<string, { name: string; suggestedPrice?: number }>, serviceLookup: Map<string, { description: string }>): readonly BundleItemResolvedAmount[] {
    const pricedEntries = bundle.items.map((item) => {
      if (item.catalogKind === 'product') {
        const product = productLookup.get(item.catalogId);
        return {
          ...item,
          amount: (product?.suggestedPrice ?? 0) * item.quantity,
          hasPrice: product?.suggestedPrice != null,
        };
      }
      return { ...item, amount: 0, hasPrice: false };
    });

    const totalPricedAmount = pricedEntries.reduce((total, item) => total + (item.hasPrice ? item.amount : 0), 0);
    const bundleAmount = bundle.bundlePrice ?? totalPricedAmount;

    return bundle.items.map((item) => {
      const baseInfo = pricedEntries.find((entry) => entry.id === item.id) ?? {
        ...item, amount: 0, hasPrice: false,
      };
      if (item.catalogKind === 'product') {
        const product = productLookup.get(item.catalogId);
        const base = (product?.suggestedPrice ?? 0) * item.quantity;
        const percentage = typeof item.percentage === 'number' ? item.percentage / 100 : undefined;
        const explicitAmount = percentage != null ? bundleAmount * percentage : undefined;
        const fallbackAmount = totalPricedAmount > 0 ? bundleAmount * (base / totalPricedAmount) : base;
        return {
          id: item.id,
          catalogKind: item.catalogKind,
          catalogId: item.catalogId,
          quantity: item.quantity,
          amount: explicitAmount ?? fallbackAmount,
          name: product?.name ?? 'Prodotto sconosciuto',
        };
      }

      const service = serviceLookup.get(item.catalogId);
      const remaining = Math.max(bundleAmount - pricedEntries.filter((entry) => entry.catalogKind === 'product').reduce((total, entry) => total + entry.amount, 0), 0);
      const fallbackAmount = bundle.items.filter((entry) => entry.catalogKind === 'service').length === 1 ? remaining : 0;
      return {
        id: item.id,
        catalogKind: item.catalogKind,
        catalogId: item.catalogId,
        quantity: item.quantity,
        amount: fallbackAmount,
        name: service?.description ?? 'Servizio sconosciuto',
      };
    });
  }

  private validate(input: BundleInput): void {
    if (!input.name.trim()) throw new Error('Il nome del pacchetto e obbligatorio.');
    if (!input.items.length) throw new Error('Il pacchetto deve contenere almeno un elemento.');
    if (input.bundlePrice !== undefined && (!Number.isFinite(input.bundlePrice) || input.bundlePrice < 0)) throw new Error('Il prezzo del pacchetto deve essere positivo o zero.');
    if (input.items.some((item) => Number(item.quantity ?? 1) <= 0)) throw new Error('La quantita dei componenti deve essere maggiore di zero.');
    const percentages = input.items.filter((item) => item.percentage != null).map((item) => Number(item.percentage ?? 0));
    if (percentages.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) throw new Error('Le percentuali dei componenti devono essere comprese tra 0 e 100.');
    const percentTotal = percentages.reduce((total, value) => total + value, 0);
    if (percentages.length !== input.items.length || Math.abs(percentTotal - 100) > 0.01) throw new Error('La somma delle percentuali dei componenti deve essere 100%.');
  }
}
