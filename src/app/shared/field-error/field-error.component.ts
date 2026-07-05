import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { DEFAULT_VALIDATION_MESSAGES, ValidationMessages } from '../validators/validation-messages';

/** Consistent inline validation message for any reactive-form control —
 * `<app-field-error [control]="form.controls.email" />` — shows the first
 * active error once the control is touched or dirty, using the shared
 * message map (override/extend per-field via `[messages]`). */
@Component({
  selector: 'app-field-error',
  standalone: true,
  template: `
    @if (getMessage(); as text) {
      <span class="field-error">{{ text }}</span>
    }
  `,
  styles: `
    .field-error {
      display: block;
      color: #c62828;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }
  `,
})
export class FieldErrorComponent {
  @Input({ required: true }) control!: AbstractControl;
  @Input() messages: ValidationMessages = {};

  getMessage(): string | null {
    const control = this.control;
    if (!control || !control.errors || (!control.touched && !control.dirty)) {
      return null;
    }
    const [key, error] = Object.entries(control.errors)[0] ?? [];
    if (!key) {
      return null;
    }
    const resolved = this.messages[key] ?? DEFAULT_VALIDATION_MESSAGES[key];
    if (!resolved) {
      return null;
    }
    return typeof resolved === 'function' ? resolved(error) : resolved;
  }
}
