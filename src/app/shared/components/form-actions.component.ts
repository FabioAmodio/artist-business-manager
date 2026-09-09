import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form-actions',
  templateUrl: './form-actions.component.html',
  styleUrl: './form-actions.component.scss',
})
export class FormActionsComponent {
  readonly disabled = input(false);
  readonly saving = input(false);
  readonly saveLabel = input('Salva');
  readonly longPressEnabled = input(false);
  readonly cancel = output<void>();
  readonly save = output<void>();
  readonly longPress = output<void>();

  protected readonly holding = signal(false);
  private holdTimer: ReturnType<typeof setTimeout> | undefined;
  private longPressConsumed = false;

  protected startHold(event: PointerEvent): void {
    if (!this.longPressEnabled() || this.disabled() || this.saving() || event.pointerType === 'mouse') return;
    this.longPressConsumed = false;
    this.holding.set(true);
    this.holdTimer = setTimeout(() => {
      this.holdTimer = undefined;
      this.longPressConsumed = true;
      this.holding.set(false);
      this.longPress.emit();
    }, 600);
  }

  protected endHold(event: Event): void {
    if (!this.holding() && !this.holdTimer) return;
    if (event.type === 'pointercancel' || event.type === 'pointerleave') this.longPressConsumed = false;
    this.clearHold();
  }

  protected handleSaveClick(event: MouseEvent): void {
    if (!this.longPressEnabled()) return;
    event.preventDefault();
    event.stopPropagation();
    if (this.longPressConsumed) {
      this.longPressConsumed = false;
      return;
    }
    this.save.emit();
  }

  private clearHold(): void {
    if (this.holdTimer) clearTimeout(this.holdTimer);
    this.holdTimer = undefined;
    this.holding.set(false);
  }
}
