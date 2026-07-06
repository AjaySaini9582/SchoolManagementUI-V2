import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';

import { AllAsignSubjectDTO, ClassWithSectionsDto, Subject as AssignedSubject } from '../../core/models/setup.model';
import { MasterApiResponseDTO } from '../../core/models/shared.model';
import { DAYS_OF_WEEK, TimetablePeriod, TimetablePeriodListItem } from '../../core/models/timetable.model';
import { EmployeeService } from '../../core/services/employee.service';
import { SetupService } from '../../core/services/setup.service';
import { TimetableService } from '../../core/services/timetable.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [
    EmptyStateComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './timetable.component.html',
  styleUrl: './timetable.component.scss',
})
export class TimetableComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly employeeService = inject(EmployeeService);
  private readonly timetableService = inject(TimetableService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly days = DAYS_OF_WEEK;

  readonly loadingLookups = signal(true);
  readonly loadingTimetable = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly formDay = signal<number | null>(null);

  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly assignedSubjects = signal<AllAsignSubjectDTO[]>([]);
  readonly teachers = signal<MasterApiResponseDTO[]>([]);
  readonly periods = signal<TimetablePeriodListItem[]>([]);

  readonly pickerForm = this.formBuilder.nonNullable.group({
    classId: [null as number | null, Validators.required],
    classSectionId: [null as number | null, Validators.required],
  });

  readonly form = this.formBuilder.nonNullable.group({
    periodNumber: [1, Validators.required],
    subjectId: [null as number | null, Validators.required],
    teacherId: [null as number | null],
    startTime: [''],
    endTime: [''],
  });

  ngOnInit(): void {
    forkJoin({
      classSections: this.setupService.getAllClassesWithSections(),
      assignedSubjects: this.setupService.getAllAssignedSubjects(),
      teachers: this.employeeService.getAllTeachers(),
    }).subscribe({
      next: (result) => {
        this.classSections.set(result.classSections.data ?? []);
        this.assignedSubjects.set(result.assignedSubjects.data ?? []);
        this.teachers.set(result.teachers.data ?? []);
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
        this.toast.error('Unable to load classes, subjects, and teachers.');
      },
    });

    this.pickerForm.controls.classId.valueChanges.subscribe(() => {
      this.pickerForm.controls.classSectionId.setValue(null);
      this.periods.set([]);
    });
    this.pickerForm.controls.classSectionId.valueChanges.subscribe(() => this.loadTimetable());
  }

  sectionsForSelectedClass(): { id: number; name: string }[] {
    return this.classSections().find((cls) => cls.id === this.pickerForm.controls.classId.value)?.sections ?? [];
  }

  subjectsForSelectedClass(): AssignedSubject[] {
    return this.assignedSubjects().find((a) => a.classId === this.pickerForm.controls.classId.value)?.subjects ?? [];
  }

  currentDayLabel(): string {
    return this.days.find((d) => d.value === this.formDay())?.label ?? '';
  }

  periodsForDay(dayOfWeek: number): TimetablePeriodListItem[] {
    return this.periods()
      .filter((p) => p.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.periodNumber - b.periodNumber);
  }

  private loadTimetable(): void {
    const classSectionId = this.pickerForm.controls.classSectionId.value;
    this.showForm.set(false);
    if (!classSectionId) {
      this.periods.set([]);
      return;
    }
    this.loadingTimetable.set(true);
    this.timetableService.getTimetable(classSectionId).subscribe({
      next: (response) => {
        this.periods.set(response.data ?? []);
        this.loadingTimetable.set(false);
      },
      error: () => {
        this.loadingTimetable.set(false);
        this.toast.error('Unable to load the timetable.');
      },
    });
  }

  openCreate(dayOfWeek: number): void {
    this.editingId.set(null);
    this.formDay.set(dayOfWeek);
    const nextPeriodNumber = Math.max(0, ...this.periodsForDay(dayOfWeek).map((p) => p.periodNumber)) + 1;
    this.form.reset({ periodNumber: nextPeriodNumber, subjectId: null, teacherId: null, startTime: '', endTime: '' });
    this.showForm.set(true);
  }

  openEdit(period: TimetablePeriodListItem): void {
    this.editingId.set(period.id);
    this.formDay.set(period.dayOfWeek);
    this.form.reset({
      periodNumber: period.periodNumber,
      subjectId: period.subjectId,
      teacherId: period.teacherId,
      startTime: period.startTime ?? '',
      endTime: period.endTime ?? '',
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
    const dayOfWeek = this.formDay();
    if (!classSectionId || dayOfWeek === null) {
      return;
    }
    const value = this.form.getRawValue();
    const period: TimetablePeriod = {
      id: this.editingId() ?? 0,
      classSectionId,
      dayOfWeek,
      periodNumber: value.periodNumber,
      subjectId: value.subjectId as number,
      teacherId: value.teacherId,
      startTime: value.startTime || null,
      endTime: value.endTime || null,
    };

    this.saving.set(true);
    this.timetableService.createOrUpdatePeriod(period).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) {
          this.toast.success('Period saved.');
          this.showForm.set(false);
          this.loadTimetable();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to save this period.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to save this period right now.');
      },
    });
  }

  confirmDelete(period: TimetablePeriodListItem): void {
    this.confirmDialog
      .confirm({ title: 'Remove period', message: `Remove period ${period.periodNumber} (${period.subjectName})?`, confirmLabel: 'Remove', danger: true })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.timetableService.deletePeriod(period.id).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Period removed.');
              this.loadTimetable();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to remove this period.');
            }
          },
          error: () => this.toast.error('Unable to remove this period right now.'),
        });
      });
  }
}
