import { Injectable, computed, inject, signal } from '@angular/core';
import { FairService } from '../../application/fairs/fair.service';
import type { Fair } from '../../domain/models/fair';
import { STORAGE_PROVIDER } from '../configuration/environment.tokens';
import type { IStorageProvider } from '../storage/storage-provider';

interface ForcedFairSetting {
  readonly id: 'forced-fair-mode';
  readonly source: 'forced-fair';
  readonly fairId: string;
  readonly updatedAt: string;
}

const SETTINGS_COLLECTION = 'appSettings';
const SETTINGS_ID = 'forced-fair-mode';

@Injectable({ providedIn: 'root' })
export class ActiveFairService {
  private readonly fairService = inject(FairService);
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);
  private readonly fairs = signal<readonly Fair[]>([]);
  private readonly forcedFairId = signal<string | null>(null);

  readonly realActiveFair = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.fairs().find((fair) => fair.startDate <= today && today <= fair.endDate) ?? null;
  });
  readonly forcedFair = computed(() => this.fairs().find((fair) => fair.id === this.forcedFairId()) ?? null);
  readonly activeFair = computed(() => this.forcedFair() ?? this.realActiveFair());
  readonly isForced = computed(() => this.forcedFair() !== null);

  async initialize(): Promise<void> {
    const [fairs, setting] = await Promise.all([
      this.fairService.list(),
      this.storage.get<ForcedFairSetting>(SETTINGS_COLLECTION, SETTINGS_ID),
    ]);
    this.fairs.set(fairs);
    if (setting?.fairId && fairs.some((fair) => fair.id === setting.fairId)) {
      this.forcedFairId.set(setting.fairId);
    } else if (setting) {
      await this.storage.deletePermanent(SETTINGS_COLLECTION, SETTINGS_ID);
    }
  }

  setFairs(fairs: readonly Fair[]): void {
    this.fairs.set(fairs);
    if (this.forcedFairId() && !fairs.some((fair) => fair.id === this.forcedFairId())) void this.clearForcedFair();
  }

  async forceFair(fairId: string): Promise<void> {
    if (!this.fairs().some((fair) => fair.id === fairId)) throw new Error('Fiera non trovata.');
    await this.storage.put<ForcedFairSetting>(SETTINGS_COLLECTION, { id: SETTINGS_ID, source: 'forced-fair', fairId, updatedAt: new Date().toISOString() });
    this.forcedFairId.set(fairId);
  }

  async clearForcedFair(): Promise<void> {
    await this.storage.deletePermanent(SETTINGS_COLLECTION, SETTINGS_ID);
    this.forcedFairId.set(null);
  }
}