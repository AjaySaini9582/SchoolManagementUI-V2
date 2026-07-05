export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Shows a required textarea — for cancel-receipt, reject-document, deactivate-record flows. */
  requireReason?: boolean;
  reasonLabel?: string;
  danger?: boolean;
}

/** Present only when the user confirmed; cancelling/dismissing resolves `undefined`. */
export interface ConfirmDialogResult {
  reason?: string;
}
