import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { ClassWithSectionsDto } from '../../../core/models/setup.model';
import { AdmissionService } from '../../../core/services/admission.service';
import { SetupService } from '../../../core/services/setup.service';
import { CredentialsDialogComponent } from '../../../shared/credentials-dialog/credentials-dialog.component';
import { ToastService } from '../../../shared/toast/toast.service';

export interface ConfirmToStudentDialogData {
  applicationId: number;
  applicantName: string;
}

@Component({
  selector: 'app-confirm-to-student-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatProgressSpinnerModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './confirm-to-student-dialog.component.html',
})
export class ConfirmToStudentDialogComponent implements OnInit {
  readonly data = inject<ConfirmToStudentDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmToStudentDialogComponent, boolean>);
  private readonly formBuilder = inject(FormBuilder);
  private readonly setupService = inject(SetupService);
  private readonly admissionService = inject(AdmissionService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly classSections = signal<ClassWithSectionsDto[]>([]);

  readonly form = this.formBuilder.nonNullable.group({
    classId: [null as number | null, Validators.required],
    classSectionId: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.setupService.getAllClassesWithSections().subscribe({
      next: (response) => {
        this.classSections.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load classes.');
      },
    });
  }

  sectionsForSelectedClass(): { id: number; name: string }[] {
    return this.classSections().find((cls) => cls.id === this.form.controls.classId.value)?.sections ?? [];
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const classSectionId = this.form.controls.classSectionId.value as number;
    this.saving.set(true);
    this.admissionService.confirmAdmissionApplication({ id: this.data.applicationId, classSectionId }).subscribe({
      next: (response) => {
        this.saving.set(false);
        const result = response.data;
        if (response.isSuccess && result) {
          this.toast.success(`${this.data.applicantName} confirmed as a student.`);
          if (result.generatedUserName) {
            this.dialog.open(CredentialsDialogComponent, {
              data: {
                title: 'Student login created',
                username: result.generatedUserName,
                password: result.generatedPassword,
              },
              width: '400px',
            });
          }
          this.dialogRef.close(true);
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to confirm this application.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to confirm this application right now.');
      },
    });
  }
}
