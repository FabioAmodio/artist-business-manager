import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Application state service for offline-first and PWA capabilities.
 * Tracks network status, database readiness, and last backup timestamp.
 */
@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  private readonly isOnlineSubject = new BehaviorSubject<boolean>(
    typeof navigator !== 'undefined' && navigator.onLine,
  );
  readonly isOnline = signal(this.isOnlineSubject.value);
  public readonly isOnline$ = this.isOnlineSubject.asObservable();

  private readonly isDatabaseReadySubject = new BehaviorSubject<boolean>(false);
  public readonly isDatabaseReady$ = this.isDatabaseReadySubject.asObservable();

  private lastBackupTimestamp = signal<number | null>(null);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.onlineStateChanged(true));
      window.addEventListener('offline', () => this.onlineStateChanged(false));
    }
  }

  private onlineStateChanged(isOnline: boolean): void {
    this.isOnlineSubject.next(isOnline);
    this.isOnline.set(isOnline);
  }

  notifyDatabaseReady(): void {
    this.isDatabaseReadySubject.next(true);
  }

  notifyDatabaseError(): void {
    this.isDatabaseReadySubject.next(false);
  }

  recordBackupTimestamp(): void {
    this.lastBackupTimestamp.set(Date.now());
  }

  getLastBackupTimestamp(): number | null {
    return this.lastBackupTimestamp();
  }

  getIsOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  getIsDatabaseReady(): boolean {
    return this.isDatabaseReadySubject.value;
  }
}

