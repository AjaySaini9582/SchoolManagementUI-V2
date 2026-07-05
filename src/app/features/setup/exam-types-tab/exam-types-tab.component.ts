import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { ExamTypeRequest } from '../../../core/models/setup.model';
import { SetupService } from '../../../core/services/setup.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

/** No `deactivateExamType` endpoint exists on the backend — create/edit only.
 * `semesterId` has no seeded lookup table yet (FKs into the generic
 * MasterKeyData mechanism, but no "Semester" key group has been seeded), so
 * it's a plain number input rather than a picker until that's added. */
@Component({
  selector: 'app-exam-types-tab',
  standalone: true,
  imports: [
    EmptyStateComponent,
    FieldErrorComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './exam-types-tab.component.html',
  styleUrl: './exam-types-tab.component.scss',
})
export class ExamTypesTabComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly examTypes = signal<ExamTypeRequest[]>([]);
  readonly displayedColumns = ['type', 'code', 'isReportCard', 'semesterId', 'status', 'actions'];

  readonly form = this.formBuilder.nonNullable.group({
    type: ['', Validators.required],
    code: ['', Validators.required],
    isReportCard: ['No', Validators.required],
    semesterId: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.setupService.getAllExamType().subscribe({
      next: (response) => {
        this.examTypes.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load exam types.');
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ type: '', code: '', isReportCard: 'No', semesterId: 1 });
    this.showForm.set(true);
  }

  openEdit(examType: ExamTypeRequest): void {
    this.editingId.set(examType.id);
    this.form.reset({
      type: examType.type,
      code: examType.code,
      isReportCard: examType.isReportCard,
      semesterId: examType.semesterId,
    });
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.setupService
      .createOrUpdateExamType({ id: this.editingId() ?? 0, ...value, isActive: true })
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.isSuccess) {
            this.toast.success('Exam type saved.');
            this.showForm.set(false);
            this.load();
          } else {
            this.toast.error(response.errorMessage ?? 'Unable to save exam type.');
          }
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Unable to save exam type right now.');
        },
      });
  }
}
