import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, type ControlValueAccessor } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-number-stepper',
  templateUrl: './number-stepper.component.html',
  styleUrl: './number-stepper.component.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NumberStepperComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => NumberStepperComponent), multi: true },
  ],
})
export class NumberStepperComponent implements ControlValueAccessor, Validator {
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly step = input(1);
  readonly integer = input(false);
  readonly decimals = input<number | undefined>(undefined);
  readonly disabled = input(false);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly paidAmount = input<number | undefined>(undefined);

  protected value: number | null = null;
  protected displayValue = '';
  protected formDisabled = false;
  private focused = false;
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  protected get inputMode(): string { return this.integer() ? 'numeric' : 'decimal'; }
  protected get isDisabled(): boolean { return this.disabled() || this.formDisabled; }
  protected get canDecrement(): boolean { return !this.isDisabled && (this.min() == null || (this.value ?? 0) > this.min()!); }
  protected get canIncrement(): boolean { return !this.isDisabled && (this.max() == null || (this.value ?? 0) < this.max()!); }

  writeValue(value: number | null | undefined): void {
    this.value = value == null || Number.isNaN(value) ? null : value;
    this.refreshDisplay();
  }
  registerOnChange(fn: (value: number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.formDisabled = isDisabled; }

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value == null || value === '') return null;
    if (this.min() != null && value < this.min()!) return { min: { min: this.min(), actual: value } };
    if (this.max() != null && value > this.max()!) return { max: { max: this.max(), actual: value } };
    return null;
  }

  protected onFocus(): void { this.focused = true; }

  protected onInputChange(raw: string): void {
    this.displayValue = raw;
    if (raw === '') { this.value = null; this.onChange(null); return; }
    const parsed = Number(raw);
    this.value = Number.isNaN(parsed) ? null : parsed;
    this.onChange(this.value);
  }

  protected touched(): void {
    this.focused = false;
    this.refreshDisplay();
    this.onTouched();
  }

  protected increment(): void { this.applyDelta(this.step()); }
  protected decrement(): void { this.applyDelta(-this.step()); }

  private applyDelta(delta: number): void {
    if (this.isDisabled) return;
    let next = this.roundToStep((this.value ?? 0) + delta);
    if (this.min() != null) next = Math.max(this.min()!, next);
    if (this.max() != null) next = Math.min(this.max()!, next);
    this.value = next;
    this.refreshDisplay();
    this.onChange(next);
    this.onTouched();
  }

  private refreshDisplay(): void {
    if (this.focused) return;
    if (this.value == null) { this.displayValue = ''; return; }
    this.displayValue = this.decimals() != null ? this.value.toFixed(this.decimals()!) : this.value.toString();
  }

  private roundToStep(value: number): number {
    const factor = Math.pow(10, this.stepDecimals());
    return Math.round(value * factor) / factor;
  }

  private stepDecimals(): number {
    const stepText = this.step().toString();
    const dotIndex = stepText.indexOf('.');
    return dotIndex === -1 ? 0 : stepText.length - dotIndex - 1;
  }
}
