import { Clipboard } from '@angular/cdk/clipboard';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { ToastService } from '../toast/toast.service';

export interface CredentialsDialogData {
  title?: string;
  message?: string;
  username: string | null;
  password: string | null;
}

/** Shows a generated username/password exactly once — the backend never
 * re-displays a generated password after this response, so this is the
 * only chance to copy it. Used after Student/Employee creation and
 * Admin-triggered password resets. */
@Component({
  selector: 'app-credentials-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './credentials-dialog.component.html',
  styleUrl: './credentials-dialog.component.scss',
})
export class CredentialsDialogComponent {
  readonly data = inject<CredentialsDialogData>(MAT_DIALOG_DATA);
  private readonly clipboard = inject(Clipboard);
  private readonly toast = inject(ToastService);

  copy(value: string | null): void {
    if (!value) {
      return;
    }
    this.clipboard.copy(value);
    this.toast.success('Copied to clipboard.');
  }
}
