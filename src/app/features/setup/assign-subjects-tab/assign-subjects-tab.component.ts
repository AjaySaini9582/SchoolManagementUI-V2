import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { AllAsignSubjectDTO, Subject } from '../../../core/models/setup.model';
import { MasterApiResponseDTO } from '../../../core/models/shared.model';
import { SetupService } from '../../../core/services/setup.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-assign-subjects-tab',
  standalone: true,
  imports: [
    EmptyStateComponent,
    FieldErrorComponent,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './assign-subjects-tab.component.html',
  styleUrl: './assign-subjects-tab.component.scss',
})
export class AssignSubjectsTabComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly assigning = signal(false);
  readonly assignments = signal<AllAsignSubjectDTO[]>([]);
  readonly classOptions = signal<MasterApiResponseDTO[]>([]);
  readonly subjectOptions = signal<MasterApiResponseDTO[]>([]);

  readonly form = this.formBuilder.nonNullable.group({
    classId: [null as number | null, Validators.required],
    subjectId: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.loadAssignments();
    this.setupService.getAllClasses().subscribe((response) => this.classOptions.set(response.data ?? []));
    this.setupService.getAllSubject().subscribe((response) => this.subjectOptions.set(response.data ?? []));
  }

  loadAssignments(): void {
    this.loading.set(true);
    this.setupService.getAllAssignedSubjects().subscribe({
      next: (response) => {
        this.assignments.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load subject assignments.');
      },
    });
  }

  assign(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { classId, subjectId } = this.form.getRawValue();
    this.assigning.set(true);
    this.setupService.assignSubject({ classId: classId as number, subjectId: subjectId as number }).subscribe({
      next: (response) => {
        this.assigning.set(false);
        if (response.isSuccess) {
          this.toast.success('Subject assigned.');
          this.form.reset();
          this.loadAssignments();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to assign subject.');
        }
      },
      error: () => {
        this.assigning.set(false);
        this.toast.error('Unable to assign subject right now.');
      },
    });
  }

  confirmRemove(className: string, subject: Subject): void {
    this.confirmDialog
      .confirm({
        title: 'Remove subject',
        message: `Remove ${subject.subjectName} from ${className}?`,
        confirmLabel: 'Remove',
        danger: true,
      })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.setupService.deleteAssignSubject(subject.assignmentId).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Subject removed.');
              this.loadAssignments();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to remove subject.');
            }
          },
          error: () => this.toast.error('Unable to remove subject right now.'),
        });
      });
  }
}
