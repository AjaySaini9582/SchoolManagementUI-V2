import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const DEFAULT_DURATION_MS = 4000;
const ERROR_DURATION_MS = 6000;

/** Thin wrapper over `MatSnackBar` so every form submit / API call reports
 * success and failure the same way instead of each feature reinventing it. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: DEFAULT_DURATION_MS,
      panelClass: 'app-toast-success',
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: ERROR_DURATION_MS,
      panelClass: 'app-toast-error',
    });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: DEFAULT_DURATION_MS,
      panelClass: 'app-toast-info',
    });
  }
}
