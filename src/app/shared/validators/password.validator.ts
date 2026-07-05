import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Mirrors `PasswordHasher.IsPasswordValid` (SRS.Bal/CoreFunction/PasswordHasher.cs)
 * exactly — min 8 chars, at least one lowercase, one uppercase, one digit,
 * one non-alphanumeric char — so the frontend rejects before the backend
 * does. Not wired to any endpoint yet: `IsPasswordValid` isn't called from
 * any controller today (login/reset flows generate passwords server-side),
 * so this is ready for whenever a self-service set/change-password form
 * that accepts a user-typed password is added. */
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

export function passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    return PASSWORD_PATTERN.test(control.value) ? null : { passwordComplexity: true };
  };
}
