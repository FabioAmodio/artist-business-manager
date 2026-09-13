import { Injectable, inject, signal } from '@angular/core';
import { STORAGE_PROVIDER } from '../../core/configuration/environment.tokens';
import type { IStorageProvider } from '../../core/storage/storage-provider';
import { FirebaseAuthService } from '../../core/firebase/firebase-auth.service';
import { WorkspaceService } from '../../core/firebase/workspace.service';
import { FirestoreProvider } from '../../core/storage/firestore.provider';
import type { NotificationEvent, NotificationState, NotificationStateStatus } from '../../domain/models/notification';
import type { NotificationEvaluationRun, NotificationStatsOutbox } from '../../domain/models/notification-evaluation';
import { evaluateOperationNotifications, notificationLocalDate } from '../../domain/shared/notification-evaluation';
import type { Operation } from '../../domain/models/operation';
import type { WorkflowSettings } from '../../domain/models/workflow-settings';

const WORKFLOW_SETTINGS_COLLECTION = 'workflowSettings';
const WORKFLOW_SETTINGS_ID = 'current';
const NOTIFICATIONS_COLLECTION = 'notifications';
const NOTIFICATION_STATES_COLLECTION = 'notificationStates';
const EVALUATION_RUNS_COLLECTION = 'notificationEvaluationRuns';
const STATS_OUTBOX_COLLECTION = 'notificationStatsOutbox';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly storage = inject<IStorageProvider>(STORAGE_PROVIDER);
  private readonly auth = inject(FirebaseAuthService);
  private readonly workspace = inject(WorkspaceService);
  private readonly firestore = inject(FirestoreProvider);
  readonly notifications = signal<readonly NotificationEvent[]>([]);
  readonly evaluating = signal(false);
  readonly lastEvaluation = signal<NotificationEvaluationRun | null>(null);
  readonly error = signal('');
  private pendingRecalculate = false;

  /** Ricalcola le notifiche operative: va richiamato al bootstrap e ad ogni modifica di Operation/WorkflowSettings, non solo una volta al giorno. */
  async recalculate(now = new Date()): Promise<void> {
    if (this.evaluating()) { this.pendingRecalculate = true; return; }
    this.evaluating.set(true);
    this.error.set('');
    const startedAt = new Date().toISOString();
    const started = performance.now();
    const workflowSettings = await this.storage.get<WorkflowSettings>(WORKFLOW_SETTINGS_COLLECTION, WORKFLOW_SETTINGS_ID);
    const dueSoonDays = workflowSettings?.dueSoonDays ?? 7;
    const policyVersion = `workflow-v1:${dueSoonDays}`;
    const localDate = notificationLocalDate(now);
    const runId = this.runId(localDate, policyVersion);
    try {
      const operations = await this.storage.list<Operation>('operations');
      const result = evaluateOperationNotifications(operations, { dueSoonDays, policyVersion }, now);
      const candidateIds = new Set(result.candidates.map((candidate) => candidate.id));
      const existingOperationNotifications = (await this.storage.list<NotificationEvent>(NOTIFICATIONS_COLLECTION)).filter((notification) => notification.entityType === 'operation');

      let newNotifications = 0;
      for (const notification of result.candidates) {
        const existing = await this.storage.get<NotificationEvent>(NOTIFICATIONS_COLLECTION, notification.id);
        if (!existing) {
          await this.storage.put(NOTIFICATIONS_COLLECTION, notification);
          await this.storage.put(NOTIFICATION_STATES_COLLECTION, this.initialState(notification.id, now));
          newNotifications += 1;
          await this.syncNotificationRemote(notification);
        }
      }

      let removedNotifications = 0;
      for (const stale of existingOperationNotifications) {
        if (candidateIds.has(stale.id)) continue;
        await this.storage.deletePermanent(NOTIFICATIONS_COLLECTION, stale.id);
        await this.storage.deletePermanent(NOTIFICATION_STATES_COLLECTION, stale.id);
        await this.deleteNotificationRemote(stale.id);
        removedNotifications += 1;
      }

      const run: NotificationEvaluationRun = {
        id: runId,
        localDate,
        userId: this.userId(),
        workspaceId: this.workspaceId(),
        policyVersion,
        status: 'completed',
        operationsAnalyzed: result.operationsAnalyzed,
        candidates: result.candidates.length,
        newNotifications,
        durationMs: Math.round(performance.now() - started),
        startedAt,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.storage.put(EVALUATION_RUNS_COLLECTION, run);
      await this.recordStats(run, removedNotifications);
      this.lastEvaluation.set(run);
      await this.loadVisible(now);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Valutazione notifiche non riuscita.';
      this.error.set(message);
      const failed: NotificationEvaluationRun = {
        id: runId,
        localDate,
        userId: this.userId(),
        workspaceId: this.workspaceId(),
        policyVersion,
        status: 'failed',
        operationsAnalyzed: 0,
        candidates: 0,
        newNotifications: 0,
        errorMessage: message,
        startedAt,
        updatedAt: new Date().toISOString(),
      };
      await this.storage.put(EVALUATION_RUNS_COLLECTION, failed);
      this.lastEvaluation.set(failed);
    } finally {
      this.evaluating.set(false);
      if (this.pendingRecalculate) {
        this.pendingRecalculate = false;
        void this.recalculate();
      }
    }
  }

  async loadVisible(now = new Date()): Promise<void> {
    const events = await this.storage.list<NotificationEvent>(NOTIFICATIONS_COLLECTION);
    const states = await this.storage.list<NotificationState>(NOTIFICATION_STATES_COLLECTION);
    const stateByNotification = new Map(states.map((state) => [state.notificationId, state]));
    this.notifications.set(events.filter((event) => {
      const state = stateByNotification.get(event.id);
      if (!state || state.status === 'done' || state.status === 'dismissed') return false;
      return state.status !== 'snoozed' || !state.snoozedUntil || state.snoozedUntil <= now.toISOString();
    }).sort((first, second) => (first.dueDate ?? '').localeCompare(second.dueDate ?? '')));
  }

  async snooze(notificationId: string, until: Date): Promise<void> {
    await this.updateState(notificationId, 'snoozed', { snoozedUntil: until.toISOString() });
  }

  async markDone(notificationId: string): Promise<void> {
    await this.updateState(notificationId, 'done', { completedAt: new Date().toISOString() });
  }

  async dismiss(notificationId: string): Promise<void> {
    await this.updateState(notificationId, 'dismissed', { dismissedAt: new Date().toISOString() });
  }

  private async updateState(notificationId: string, status: NotificationStateStatus, dates: Partial<NotificationState>): Promise<void> {
    const current = await this.storage.get<NotificationState>(NOTIFICATION_STATES_COLLECTION, notificationId);
    if (!current) return;
    await this.storage.put(NOTIFICATION_STATES_COLLECTION, { ...current, ...dates, status, updatedAt: new Date().toISOString() });
    await this.loadVisible();
  }

  private initialState(notificationId: string, now: Date): NotificationState {
    return { id: notificationId, notificationId, userId: this.userId(), status: 'pending', updatedAt: now.toISOString() };
  }

  private async recordStats(run: NotificationEvaluationRun, removedNotifications: number): Promise<void> {
    const id = `${run.localDate}:${this.workspaceId() ?? 'local'}:${this.userId() ?? 'local'}`;
    const current = await this.storage.get<NotificationStatsOutbox>(STATS_OUTBOX_COLLECTION, id);
    await this.storage.put(STATS_OUTBOX_COLLECTION, {
      id,
      localDate: run.localDate,
      userId: this.userId(),
      workspaceId: this.workspaceId(),
      deviceId: this.deviceId(),
      evaluations: (current?.evaluations ?? 0) + 1,
      operationsAnalyzed: (current?.operationsAnalyzed ?? 0) + run.operationsAnalyzed,
      candidates: (current?.candidates ?? 0) + run.candidates,
      newNotifications: (current?.newNotifications ?? 0) + run.newNotifications,
      deduplicatedNotifications: (current?.deduplicatedNotifications ?? 0) + Math.max(0, run.candidates - run.newNotifications),
      removedNotifications: (current?.removedNotifications ?? 0) + removedNotifications,
      snoozedNotifications: current?.snoozedNotifications ?? 0,
      completedNotifications: current?.completedNotifications ?? 0,
      dismissedNotifications: current?.dismissedNotifications ?? 0,
      errors: (current?.errors ?? 0) + (run.status === 'failed' ? 1 : 0),
      updatedAt: new Date().toISOString(),
    });
  }

  /** Sincronizza solo la tabella `notifications`: gli stati per utente restano locali in questa iterazione. */
  private canSyncRemote(): boolean { return Boolean(this.workspace.activeWorkspaceId() && this.auth.user()); }

  private async syncNotificationRemote(notification: NotificationEvent): Promise<void> {
    if (!this.canSyncRemote()) return;
    try { await this.firestore.put(NOTIFICATIONS_COLLECTION, notification); }
    catch (error) { console.error('Impossibile sincronizzare la notifica su Firebase:', error); }
  }

  private async deleteNotificationRemote(notificationId: string): Promise<void> {
    if (!this.canSyncRemote()) return;
    try { await this.firestore.deletePermanent(NOTIFICATIONS_COLLECTION, notificationId); }
    catch (error) { console.error('Impossibile rimuovere la notifica remota:', error); }
  }

  private runId(localDate: string, policyVersion: string): string { return `${localDate}:${this.workspaceId() ?? 'local'}:${this.userId() ?? 'local'}:${policyVersion}`; }
  private userId(): string | undefined { return this.auth.user()?.uid; }
  private workspaceId(): string | undefined { return this.workspace.activeWorkspaceId() ?? undefined; }
  private deviceId(): string | undefined { return typeof localStorage === 'undefined' ? undefined : localStorage.getItem('abm-device-id') ?? undefined; }
}