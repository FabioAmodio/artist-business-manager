import { Injectable, signal } from '@angular/core';

export type SyncStatus = 'local-only' | 'pending' | 'syncing' | 'synced' | 'error';

@Injectable({ providedIn: 'root' })
export class SyncStatusService {
  readonly status = signal<SyncStatus>('local-only');
  readonly changeVersion = signal(0);
  private suppressionDepth = 0;

  notifyLocalChange(): void {
    if (this.suppressionDepth > 0) return;
    this.status.set('pending');
    this.changeVersion.update((version) => version + 1);
  }

  setStatus(status: SyncStatus): void { this.status.set(status); }
  isSuppressed(): boolean { return this.suppressionDepth > 0; }

  async suppress<T>(work: () => Promise<T>): Promise<T> {
    this.suppressionDepth += 1;
    try { return await work(); }
    finally { this.suppressionDepth -= 1; }
  }
}
