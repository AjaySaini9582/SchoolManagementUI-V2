import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';

export interface MasterItemDialogData {
  /** Singular label, e.g. "Department" — used in the dialog title. */
  label: string;
  item: { id: number; name: string } | null;
}

export interface MasterItemDialogResult {
  id: number;
  name: string;
}

/** Simple add/edit dialog for the `{id, name, isActive}` master-list shape
 * (Department, Designation, Subject, Bus Route). */
@Component({
  selector: 'app-master-item-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  templateUrl: './master-item-dialog.component.html',
})
export class MasterItemDialogComponent {
  readonly data = inject<MasterItemDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<MasterItemDialogComponent, MasterItemDialogResult>);
  private readonly formBuilder = inject(FormBuilder);

  readonly isEdit = this.data.item !== null;
  readonly form = this.formBuilder.nonNullable.group({
    name: [this.data.item?.name ?? '', Validators.required],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close({ id: this.data.item?.id ?? 0, name: this.form.getRawValue().name });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
