import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form-actions',
  template: `
    <div class="form-actions">
      <button class="cancel-button" type="button" (click)="cancel.emit()">
        <span aria-hidden="true">×</span>
        Annulla
      </button>
      <button class="save-button" type="submit" [disabled]="disabled() || saving()">
        <span aria-hidden="true">✓</span>
        {{ saving() ? 'Salvataggio...' : saveLabel() }}
      </button>
    </div>
  `,
  styles: `
    .form-actions { align-items: center; display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.5rem; }
    .form-actions button { align-items: center; border-radius: var(--radius-base); cursor: pointer; display: inline-flex; font: 600 .9rem var(--font-sans); gap: .45rem; justify-content: center; min-height: var(--touch-target-min); padding: .65rem 1rem; }
    .cancel-button { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-primary); }
    .cancel-button:hover { background: var(--color-surface-tertiary); border-color: var(--color-accent); }
    .save-button { background: var(--color-primary); border: 1px solid var(--color-primary); color: var(--color-surface); }
    .save-button:hover { background: var(--color-primary-light); }
    .form-actions button:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
    .form-actions button:disabled { cursor: wait; opacity: .6; }
    @media (max-width: 480px) { .form-actions { flex-direction: column-reverse; } .form-actions button { width: 100%; } }
  `,
})
export class FormActionsComponent {
  readonly disabled = input(false);
  readonly saving = input(false);
  readonly saveLabel = input('Salva');
  readonly cancel = output<void>();
}
