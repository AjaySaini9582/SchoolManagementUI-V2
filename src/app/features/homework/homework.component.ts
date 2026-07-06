import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';

import { Homework, HomeworkListItem } from '../../core/models/homework.model';
import { AllAsignSubjectDTO, ClassWithSectionsDto, Subject as AssignedSubject } from '../../core/models/setup.model';
import { HomeworkService } from '../../core/services/homework.service';
import { SetupService } from '../../core/services/setup.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../shared/field-error/field-error.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-homework',
  standalone: true,
  imports: [
    DatePipe,
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
  templateUrl: './homework.component.html',
  styleUrl: './homework.component.scss',
})
export class HomeworkComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly homeworkService = inject(HomeworkService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly loadingLookups = signal(true);
  readonly loadingHomework = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly assignedSubjects = signal<AllAsignSubjectDTO[]>([]);
  readonly homework = signal<HomeworkListItem[]>([]);
  readonly displayedColumns = ['subject', 'title', 'homeworkDate', 'dueDate', 'actions'];

  readonly pickerForm = this.formBuilder.nonNullable.group({
    classId: [null as number | null, Validators.required],
    classSectionId: [null as number | null, Validators.required],
  });

  readonly form = this.formBuilder.nonNullable.group({
    subjectId: [null as number | null, Validators.required],
    title: ['', Validators.required],
    description: [''],
    homeworkDate: ['', Validators.required],
    dueDate: [''],
  });

  ngOnInit(): void {
    forkJoin({
      classSections: this.setupService.getAllClassesWithSections(),
      assignedSubjects: this.setupService.getAllAssignedSubjects(),
    }).subscribe({
      next: (result) => {
        this.classSections.set(result.classSections.data ?? []);
        this.assignedSubjects.set(result.assignedSubjects.data ?? []);
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
        this.toast.error('Unable to load classes and subjects.');
      },
    });

    this.pickerForm.controls.classId.valueChanges.subscribe(() => {
      this.pickerForm.controls.classSectionId.setValue(null);
      this.homework.set([]);
    });
    this.pickerForm.controls.classSectionId.valueChanges.subscribe(() => this.loadHomework());
  }

  sectionsForSelectedClass(): { id: number; name: string }[] {
    return this.classSections().find((cls) => cls.id === this.pickerForm.controls.classId.value)?.sections ?? [];
  }

  subjectsForSelectedClass(): AssignedSubject[] {
    return this.assignedSubjects().find((a) => a.classId === this.pickerForm.controls.classId.value)?.subjects ?? [];
  }

  private loadHomework(): void {
    const classSectionId = this.pickerForm.controls.classSectionId.value;
    this.showForm.set(false);
    if (!classSectionId) {
      this.homework.set([]);
      return;
    }
    this.loadingHomework.set(true);
    this.homeworkService.getHomeworkList(classSectionId).subscribe({
      next: (response) => {
        this.homework.set(response.data ?? []);
        this.loadingHomework.set(false);
      },
      error: () => {
        this.loadingHomework.set(false);
        this.toast.error('Unable to load homework.');
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ subjectId: null, title: '', description: '', homeworkDate: new Date().toISOString().substring(0, 10), dueDate: '' });
    this.showForm.set(true);
  }

  openEdit(row: HomeworkListItem): void {
    this.editingId.set(row.id);
    this.form.reset({
      subjectId: row.subjectId,
      title: row.title ?? '',
      description: row.description ?? '',
      homeworkDate: row.homeworkDate.substring(0, 10),
      dueDate: row.dueDate ? row.dueDate.substring(0, 10) : '',
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
    const classSectionId = this.pickerForm.controls.classSectionId.value;
    if (!classSectionId) {
      return;
    }
    const value = this.form.getRawValue();
    const homework: Homework = {
      id: this.editingId() ?? 0,
      classSectionId,
      subjectId: value.subjectId as number,
      title: value.title,
      description: value.description || null,
      homeworkDate: value.homeworkDate,
      dueDate: value.dueDate || null,
      isActive: true,
    };

    this.saving.set(true);
    this.homeworkService.createOrUpdateHomework(homework).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) {
          this.toast.success('Homework saved.');
          this.showForm.set(false);
          this.loadHomework();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to save homework.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to save homework right now.');
      },
    });
  }

  confirmDeactivate(row: HomeworkListItem): void {
    this.confirmDialog
      .confirm({ title: 'Remove homework', message: `Remove "${row.title}"?`, confirmLabel: 'Remove', danger: true })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.homeworkService.deactivateHomework(row.id).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Homework removed.');
              this.loadHomework();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to remove homework.');
            }
          },
          error: () => this.toast.error('Unable to remove homework right now.'),
        });
      });
  }
}
