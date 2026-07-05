import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';

import { AllAsignSubjectDTO, ClassWithSectionsDto, ExamTypeRequest, Subject } from '../../../core/models/setup.model';
import { StudentRosterItem } from '../../../core/models/student.model';
import { ExamService } from '../../../core/services/exam.service';
import { SessionContextService } from '../../../core/services/session-context.service';
import { SetupService } from '../../../core/services/setup.service';
import { StudentService } from '../../../core/services/student.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

interface MarkRow {
  studentId: number;
  studentName: string;
  rollNumber: number | null;
  marksObtained: number | null;
  remark: string;
}

@Component({
  selector: 'app-marks-entry',
  standalone: true,
  imports: [
    EmptyStateComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './marks-entry.component.html',
  styleUrl: './marks-entry.component.scss',
})
export class MarksEntryComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly studentService = inject(StudentService);
  private readonly examService = inject(ExamService);
  private readonly sessionContext = inject(SessionContextService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly loadingRows = signal(false);
  readonly saving = signal(false);

  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly examTypes = signal<ExamTypeRequest[]>([]);
  readonly assignedSubjects = signal<AllAsignSubjectDTO[]>([]);
  readonly rows = signal<MarkRow[]>([]);

  readonly form = this.formBuilder.nonNullable.group({
    classSectionId: [null as number | null, Validators.required],
    examTypeId: [null as number | null, Validators.required],
    subjectId: [null as number | null, Validators.required],
    maxMarks: [100, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    // Reloads the roster whenever the active session changes (e.g. an
    // Admin switches sessions from the topbar while this page is open) —
    // `loadRows()` reads the session live rather than from a snapshot.
    effect(
      () => {
        this.sessionContext.activeSession();
        this.loadRows();
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    forkJoin({
      classSections: this.setupService.getAllClassesWithSections(),
      examTypes: this.setupService.getAllExamType(),
      assignedSubjects: this.setupService.getAllAssignedSubjects(),
      session: this.sessionContext.load(),
    }).subscribe({
      next: (result) => {
        this.classSections.set(result.classSections.data ?? []);
        this.examTypes.set((result.examTypes.data ?? []).filter((type) => type.isActive));
        this.assignedSubjects.set(result.assignedSubjects.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load marks entry lookups.');
      },
    });

    this.form.controls.classSectionId.valueChanges.subscribe(() => {
      this.form.controls.subjectId.setValue(null);
      this.rows.set([]);
    });
    this.form.controls.subjectId.valueChanges.subscribe(() => this.loadRows());
    this.form.controls.examTypeId.valueChanges.subscribe(() => this.loadRows());
  }

  subjectsForSelectedClass(): Subject[] {
    const classSectionId = this.form.controls.classSectionId.value;
    const classId = this.classSections().find((cls) => cls.sections.some((section) => section.id === classSectionId))?.id;
    if (!classId) {
      return [];
    }
    return this.assignedSubjects().find((entry) => entry.classId === classId)?.subjects ?? [];
  }

  private loadRows(): void {
    const classSectionId = this.form.controls.classSectionId.value;
    const examTypeId = this.form.controls.examTypeId.value;
    const subjectId = this.form.controls.subjectId.value;
    const activeSessionId = this.sessionContext.activeSession()?.id ?? null;
    this.rows.set([]);
    if (!classSectionId || !examTypeId || !subjectId || !activeSessionId) {
      return;
    }

    this.loadingRows.set(true);
    forkJoin({
      roster: this.studentService.getStudentRoster(activeSessionId, classSectionId),
      existing: this.examService.getMarks(classSectionId, examTypeId, subjectId),
    }).subscribe({
      next: ({ roster, existing }) => {
        const rosterRows = roster.data ?? [];
        const existingRecords = existing.data ?? [];
        if (existingRecords.length > 0) {
          this.form.controls.maxMarks.setValue(existingRecords[0].maxMarks);
        }

        this.rows.set(
          rosterRows.map((student) => {
            const record = existingRecords.find((item) => item.studentId === student.id);
            return {
              studentId: student.id,
              studentName: student.name ?? '',
              rollNumber: student.rollNumber,
              marksObtained: record?.marksObtained ?? null,
              remark: record?.remark ?? '',
            };
          }),
        );
        this.loadingRows.set(false);
      },
      error: () => {
        this.loadingRows.set(false);
        this.toast.error('Unable to load the class roster.');
      },
    });
  }

  updateMarks(studentId: number, marksObtained: number | null): void {
    this.rows.update((rows) => rows.map((row) => (row.studentId === studentId ? { ...row, marksObtained } : row)));
  }

  updateRemark(studentId: number, remark: string): void {
    this.rows.update((rows) => rows.map((row) => (row.studentId === studentId ? { ...row, remark } : row)));
  }

  save(): void {
    const value = this.form.getRawValue();
    if (this.form.invalid || this.rows().length === 0) {
      this.form.markAllAsTouched();
      this.toast.error('Fill in the required fields before saving.');
      return;
    }
    const maxMarks = value.maxMarks;
    if (this.rows().some((row) => row.marksObtained === null || row.marksObtained < 0 || row.marksObtained > maxMarks)) {
      this.toast.error(`Enter marks between 0 and ${maxMarks} for every student.`);
      return;
    }

    this.saving.set(true);
    this.examService
      .saveMarks({
        classSectionId: value.classSectionId as number,
        examTypeId: value.examTypeId as number,
        subjectId: value.subjectId as number,
        maxMarks,
        entries: this.rows().map((row) => ({
          studentId: row.studentId,
          marksObtained: row.marksObtained as number,
          remark: row.remark || null,
        })),
      })
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.isSuccess) {
            this.toast.success('Marks saved.');
          } else {
            this.toast.error(response.errorMessage ?? 'Unable to save marks.');
          }
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Unable to save marks right now.');
        },
      });
  }
}
