import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';

import { MASTER_KEY, MasterKeyDataValue } from '../../../core/models/master.model';
import { ClassWithSectionsDto } from '../../../core/models/setup.model';
import { AttendanceService } from '../../../core/services/attendance.service';
import { MasterService } from '../../../core/services/master.service';
import { SessionContextService } from '../../../core/services/session-context.service';
import { SetupService } from '../../../core/services/setup.service';
import { StudentService } from '../../../core/services/student.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

interface AttendanceRow {
  studentId: number;
  studentName: string;
  rollNumber: number | null;
  statusId: number | null;
  remark: string;
}

function toLocalDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-mark-attendance',
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
  templateUrl: './mark-attendance.component.html',
  styleUrl: './mark-attendance.component.scss',
})
export class MarkAttendanceComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly masterService = inject(MasterService);
  private readonly studentService = inject(StudentService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly sessionContext = inject(SessionContextService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly loadingRoster = signal(false);
  readonly saving = signal(false);
  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly statuses = signal<MasterKeyDataValue[]>([]);
  readonly rows = signal<AttendanceRow[]>([]);
  readonly alreadyMarked = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    classSectionId: [null as number | null, Validators.required],
    date: [toLocalDateInput(new Date()), Validators.required],
  });

  constructor() {
    // Re-loads the roster whenever the active session changes (e.g. an
    // Admin switches sessions from the topbar while this page is open) —
    // `loadRoster()` reads the session live rather than from a snapshot, so
    // without this the picker would keep showing the old session's roster
    // until the user re-touched the class-section/date fields.
    effect(
      () => {
        this.sessionContext.activeSession();
        this.loadRoster();
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    forkJoin({
      classSections: this.setupService.getAllClassesWithSections(),
      statuses: this.masterService.getMasterKeyData([MASTER_KEY.AttendanceStatus]),
      session: this.sessionContext.load(),
    }).subscribe({
      next: (result) => {
        this.classSections.set(result.classSections.data ?? []);
        this.statuses.set(result.statuses.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load attendance lookups.');
      },
    });

    this.form.controls.classSectionId.valueChanges.subscribe(() => this.loadRoster());
    this.form.controls.date.valueChanges.subscribe(() => this.loadRoster());
  }

  statusIdFor(name: string): number | null {
    return this.statuses().find((status) => status.text === name)?.id ?? null;
  }

  markAll(statusId: number | null): void {
    if (statusId === null) {
      return;
    }
    this.rows.update((rows) => rows.map((row) => ({ ...row, statusId })));
  }

  updateStatus(studentId: number, statusId: number): void {
    this.rows.update((rows) => rows.map((row) => (row.studentId === studentId ? { ...row, statusId } : row)));
  }

  updateRemark(studentId: number, remark: string): void {
    this.rows.update((rows) => rows.map((row) => (row.studentId === studentId ? { ...row, remark } : row)));
  }

  private loadRoster(): void {
    const classSectionId = this.form.controls.classSectionId.value;
    const date = this.form.controls.date.value;
    const activeSessionId = this.sessionContext.activeSession()?.id ?? null;
    this.rows.set([]);
    this.alreadyMarked.set(false);
    if (!classSectionId || !date || !activeSessionId) {
      return;
    }

    this.loadingRoster.set(true);
    forkJoin({
      roster: this.studentService.getStudentRoster(activeSessionId, classSectionId),
      existing: this.attendanceService.getAttendanceByClassSectionAndDate(classSectionId, date),
    }).subscribe({
      next: ({ roster, existing }) => {
        const rosterRows = roster.data ?? [];
        const existingRecords = existing.data ?? [];
        const defaultStatusId = this.statusIdFor('Present');

        this.rows.set(
          rosterRows.map((student) => {
            const record = existingRecords.find((item) => item.studentId === student.id);
            return {
              studentId: student.id,
              studentName: student.name ?? '',
              rollNumber: student.rollNumber,
              statusId: record?.statusId ?? defaultStatusId,
              remark: record?.remark ?? '',
            };
          }),
        );
        this.alreadyMarked.set(existingRecords.length > 0);
        this.loadingRoster.set(false);
      },
      error: () => {
        this.loadingRoster.set(false);
        this.toast.error('Unable to load the class roster.');
      },
    });
  }

  save(): void {
    const classSectionId = this.form.controls.classSectionId.value;
    const date = this.form.controls.date.value;
    if (!classSectionId || !date || this.rows().length === 0) {
      return;
    }
    if (this.rows().some((row) => !row.statusId)) {
      this.toast.error('Select a status for every student.');
      return;
    }

    this.saving.set(true);
    this.attendanceService
      .markAttendance({
        classSectionId,
        attendanceDate: date,
        entries: this.rows().map((row) => ({
          studentId: row.studentId,
          statusId: row.statusId as number,
          remark: row.remark || null,
        })),
      })
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.isSuccess) {
            this.toast.success('Attendance saved.');
            this.alreadyMarked.set(true);
          } else {
            this.toast.error(response.errorMessage ?? 'Unable to save attendance.');
          }
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Unable to save attendance right now.');
        },
      });
  }
}
