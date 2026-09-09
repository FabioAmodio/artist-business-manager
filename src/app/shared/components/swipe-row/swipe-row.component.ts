import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { PersistenceService } from '../../../application/persistence/persistence.service';
import type { SwipeAction } from './swipe-row.model';

const ACTION_WIDTH = 76;
const OVER_DRAG_RATIO = 2;
const FLING_VELOCITY = 0.5;
const OPEN_SNAP_RATIO = 0.5;
const AXIS_LOCK_THRESHOLD = 6;
const SNAP_ANIMATION_MS = 220;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-swipe-row',
  templateUrl: './swipe-row.component.html',
  styleUrl: './swipe-row.component.scss',
})
export class SwipeRowComponent {
  private readonly persistence = inject(PersistenceService);

  readonly id = input.required<string>();
  readonly rightActions = input<readonly SwipeAction[]>([]);
  readonly leftActions = input<readonly SwipeAction[]>([]);
  readonly openId = input<string | null>(null);
  readonly openIdChange = output<string | null>();

  protected readonly dragX = signal(0);
  protected readonly snapping = signal(false);
  protected readonly armedAction = signal<SwipeAction | null>(null);

  protected readonly swipeEnabled = computed(() => this.persistence.listInteractionMode() === 'swipe' && this.isCoarsePointer());

  private pointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private axisLocked: 'x' | 'y' | null = null;
  private history: { x: number; t: number }[] = [];

  constructor() {
    // close this row if another row in the same list is opened
    effect(() => { if (this.openId() !== this.id() && this.dragX() !== 0) this.close(); });
  }

  private isCoarsePointer(): boolean {
    return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;
  }

  private enabledActions(actions: readonly SwipeAction[]): SwipeAction[] {
    return actions.filter((action) => !action.disabled);
  }

  private hasAutoAction(actions: readonly SwipeAction[]): boolean {
    const list = this.enabledActions(actions);
    return list.length > 0 && list[list.length - 1].kind === 'auto';
  }

  protected totalWidth(side: 'right' | 'left'): number {
    return this.enabledActions(side === 'right' ? this.rightActions() : this.leftActions()).length * ACTION_WIDTH;
  }

  /** Larghezza del contenitore: include lo spazio extra per l'over-drag dell'ultima azione 'auto', altrimenti verrebbe tagliata. */
  protected maxTotalWidth(side: 'right' | 'left'): number {
    const actions = side === 'right' ? this.rightActions() : this.leftActions();
    return this.totalWidth(side) + (this.hasAutoAction(actions) ? ACTION_WIDTH : 0);
  }

  protected actionWidth(side: 'right' | 'left', action: SwipeAction): number {
    const matchesDirection = side === 'right' ? this.dragX() > 0 : this.dragX() < 0;
    if (!matchesDirection) return 0;
    const list = this.enabledActions(side === 'right' ? this.rightActions() : this.leftActions());
    const index = list.indexOf(action);
    if (index < 0) return 0;
    const before = index * ACTION_WIDTH;
    const isLast = index === list.length - 1;
    const cap = isLast && action.kind === 'auto' ? ACTION_WIDTH * OVER_DRAG_RATIO : ACTION_WIDTH;
    const raw = Math.abs(this.dragX()) - before;
    return Math.max(0, Math.min(cap, raw));
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.swipeEnabled()) return;
    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.axisLocked = null;
    this.history = [{ x: event.clientX, t: performance.now() }];
    this.snapping.set(false);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    if (this.axisLocked === null) {
      if (Math.abs(dx) < AXIS_LOCK_THRESHOLD && Math.abs(dy) < AXIS_LOCK_THRESHOLD) return;
      this.axisLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (this.axisLocked === 'x') {
        (event.target as Element).setPointerCapture?.(event.pointerId);
        if (this.openId() !== this.id()) this.openIdChange.emit(this.id());
      }
    }
    if (this.axisLocked !== 'x') return;
    event.preventDefault();
    this.history.push({ x: event.clientX, t: performance.now() });
    if (this.history.length > 5) this.history.shift();
    const maxRight = this.totalWidth('right') + (this.hasAutoAction(this.rightActions()) ? ACTION_WIDTH : 0);
    const maxLeft = this.totalWidth('left') + (this.hasAutoAction(this.leftActions()) ? ACTION_WIDTH : 0);
    this.dragX.set(Math.max(-maxLeft, Math.min(maxRight, dx)));
    this.updateArmedAction();
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    this.pointerId = null;
    if (this.axisLocked !== 'x') { this.axisLocked = null; return; }
    this.axisLocked = null;
    const armed = this.armedAction();
    if (armed) { this.executeAndClose(armed); return; }
    const distance = this.dragX();
    const velocity = this.currentVelocity();
    if (distance !== 0 && Math.abs(velocity) > FLING_VELOCITY && Math.sign(velocity) === Math.sign(distance)) {
      this.snapTo(distance > 0 ? this.totalWidth('right') : -this.totalWidth('left'));
      return;
    }
    this.snapToNearestThreshold(distance);
  }

  protected onPointerCancel(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    this.pointerId = null;
    this.axisLocked = null;
    this.snapToNearestThreshold(this.dragX());
  }

  private updateArmedAction(): void {
    const distance = this.dragX();
    const side = distance > 0 ? 'right' : distance < 0 ? 'left' : null;
    if (!side) { this.armedAction.set(null); return; }
    const list = this.enabledActions(side === 'right' ? this.rightActions() : this.leftActions());
    const last = list[list.length - 1];
    if (last?.kind !== 'auto') { this.armedAction.set(null); return; }
    // l'azione si arma solo quando il pulsante ha raggiunto la sua larghezza doppia completa, non solo superato quella standard
    const threshold = (list.length - 1) * ACTION_WIDTH + ACTION_WIDTH * OVER_DRAG_RATIO;
    this.armedAction.set(Math.abs(distance) >= threshold ? last : null);
  }

  private currentVelocity(): number {
    if (this.history.length < 2) return 0;
    const first = this.history[0];
    const last = this.history[this.history.length - 1];
    const dt = last.t - first.t;
    return dt > 0 ? (last.x - first.x) / dt : 0;
  }

  /** Stile iOS: al rilascio la card scatta sempre o completamente aperta (tutte le azioni visibili) o chiusa, mai a metà. */
  private snapToNearestThreshold(distance: number): void {
    const side = distance > 0 ? 'right' : distance < 0 ? 'left' : null;
    if (!side) { this.snapTo(0); return; }
    const total = this.totalWidth(side);
    const target = Math.abs(distance) >= total * OPEN_SNAP_RATIO ? total : 0;
    this.snapTo(side === 'right' ? target : -target);
  }

  private snapTo(value: number): void {
    this.snapping.set(true);
    this.dragX.set(value);
    this.armedAction.set(null);
    if (value === 0 && this.openId() === this.id()) this.openIdChange.emit(null);
    setTimeout(() => this.snapping.set(false), SNAP_ANIMATION_MS);
  }

  private executeAndClose(action: SwipeAction): void {
    this.snapping.set(true);
    this.dragX.set(0);
    this.armedAction.set(null);
    this.vibrate();
    if (this.openId() === this.id()) this.openIdChange.emit(null);
    setTimeout(() => this.snapping.set(false), SNAP_ANIMATION_MS);
    action.run();
  }

  private vibrate(): void {
    try { navigator.vibrate?.(15); } catch { /* haptics unsupported, e.g. iOS Safari */ }
  }

  protected runAction(action: SwipeAction): void {
    if (action.disabled) return;
    this.close();
    action.run();
  }

  protected close(): void {
    if (this.dragX() !== 0) this.snapTo(0);
  }
}
