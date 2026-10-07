import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../application/notifications/notification.service';
import { PersistenceService } from '../../application/persistence/persistence.service';
import type { NotificationEvent, NotificationKind } from '../../domain/models/notification';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { SwipeRowComponent } from '../../shared/components/swipe-row/swipe-row.component';
import type { SwipeAction } from '../../shared/components/swipe-row/swipe-row.model';

type NotificationGroupFilter = 'all' | 'works' | 'fairs';

const KIND_ICONS: Record<NotificationKind, string> = {
  'operation-due-soon': '⏰',
  'operation-overdue': '⏰',
  'fair-task-due-soon': '📅',
  'fair-task-overdue': '📅',
  reminder: '🔔',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, SwipeRowComponent],
  selector: 'app-notifications-page',
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
})
export class NotificationsPage implements OnInit {
  protected readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly persistence = inject(PersistenceService);
  protected readonly openRowId = signal<string | null>(null);
  protected readonly groupFilter = signal<NotificationGroupFilter>('all');

  ngOnInit(): void {
    if (this.notificationService.stale()) void this.notificationService.recalculate();
    else void this.notificationService.loadVisible();
  }

  protected async refresh(): Promise<void> { await this.notificationService.recalculate(); }

  protected visibleNotifications(): readonly NotificationEvent[] {
    const filter = this.groupFilter();
    return this.notificationService.notifications().filter((notification) => {
      if (filter === 'works') return notification.entityType === 'operation';
      if (filter === 'fairs') return notification.entityType === 'fair-task';
      return true;
    });
  }

  protected notificationIcon(notification: NotificationEvent): string { return KIND_ICONS[notification.kind] ?? '🔔'; }

  protected async markDone(notificationId: string): Promise<void> { await this.notificationService.markDone(notificationId); }
  protected async dismiss(notificationId: string): Promise<void> { await this.notificationService.dismiss(notificationId); }
  protected openNotification(notificationId: string): void {
    const notification = this.notificationService.notifications().find((item) => item.id === notificationId);
    if (!notification?.entityId) return;
    if (notification.entityType === 'fair-task') void this.router.navigate(['/events'], { queryParams: { open: notification.entityId } });
    else void this.router.navigate(['/works'], { queryParams: { open: notification.entityId } });
  }
  protected isMobileSwipeMode(): boolean { return this.persistence.listInteractionMode() === 'swipe' && typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true; }
  protected rightActions(notificationId: string): SwipeAction[] { return [{ key: 'open', icon: '↗', label: 'Apri', run: () => this.openNotification(notificationId) }]; }
  protected leftActions(notificationId: string): SwipeAction[] { return [
    { key: 'done', icon: '✓', label: 'Fatta', variant: 'neutral-success', run: () => void this.markDone(notificationId) },
    { key: 'snooze', icon: '◷', label: 'Domani', variant: 'neutral-warning', run: () => void this.snooze(notificationId) },
    { key: 'dismiss', icon: '×', label: 'Ignora', variant: 'danger', kind: 'auto', run: () => void this.dismiss(notificationId) },
  ]; }
  protected async snooze(notificationId: string): Promise<void> {
    const until = new Date();
    until.setDate(until.getDate() + 1);
    await this.notificationService.snooze(notificationId, until);
  }
}