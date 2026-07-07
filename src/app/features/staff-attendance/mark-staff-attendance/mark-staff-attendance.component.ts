import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';

import { EmployeeAttendanceService } from '../../../core/services/employee-attendance.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { MasterService } from '../../../core/services/master.service';
import { SetupService } from '../../../core/services/setup.service';
import { MASTER_KEY, MasterKeyDataValue } from '../../../core/models/master.model';
import { DepartmentResponseDTO } from '../../../core/models/setup.model';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

interface StaffAttendanceRow {
  employeeId: number;
  employeeName: string;
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
  selector: 'app-mark-staff-attendance',
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
  templateUrl: './mark-staff-attendance.component.html',
  styleUrl: './mark-staff-attendance.component.scss',
})
export class MarkStaffAttendanceComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly masterService = inject(MasterService);
  private readonly employeeService = inject(EmployeeService);
  private readonly employeeAttendanceService = inject(EmployeeAttendanceService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly loadingRoster = signal(false);
  readonly saving = signal(false);
  readonly departments = signal<DepartmentResponseDTO[]>([]);
  readonly statuses = signal<MasterKeyDataValue[]>([]);
  readonly rows = signal<StaffAttendanceRow[]>([]);
  readonly alreadyMarked = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    departmentId: [null as number | null],
    date: [toLocalDateInput(new Date()), Validators.required],
  });

  ngOnInit(): void {
    forkJoin({
      departments: this.setupService.getAllDepartment(),
      statuses: this.masterService.getMasterKeyData([MASTER_KEY.AttendanceStatus]),
    }).subscribe({
      next: (result) => {
        this.departments.set(result.departments.data ?? []);
        this.statuses.set(result.statuses.data ?? []);
        this.loading.set(false);
        this.loadRoster();
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load attendance lookups.');
      },
    });

    this.form.controls.departmentId.valueChanges.subscribe(() => this.loadRoster());
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

  updateStatus(employeeId: number, statusId: number): void {
    this.rows.update((rows) => rows.map((row) => (row.employeeId === employeeId ? { ...row, statusId } : row)));
  }

  updateRemark(employeeId: number, remark: string): void {
    this.rows.update((rows) => rows.map((row) => (row.employeeId === employeeId ? { ...row, remark } : row)));
  }

  private loadRoster(): void {
    const departmentId = this.form.controls.departmentId.value;
    const date = this.form.controls.date.value;
    this.rows.set([]);
    this.alreadyMarked.set(false);
    if (!date) {
      return;
    }

    this.loadingRoster.set(true);
    forkJoin({
      roster: this.employeeService.getActiveEmployeeRoster(departmentId),
      existing: this.employeeAttendanceService.getEmployeeAttendanceByDate(date, departmentId),
    }).subscribe({
      next: ({ roster, existing }) => {
        const rosterRows = roster.data ?? [];
        const existingRecords = existing.data ?? [];
        const defaultStatusId = this.statusIdFor('Present');

        this.rows.set(
          rosterRows.map((employee) => {
            const record = existingRecords.find((item) => item.employeeId === employee.id);
            return {
              employeeId: employee.id,
              employeeName: employee.name,
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
        this.toast.error('Unable to load the employee roster.');
      },
    });
  }

  save(): void {
    const date = this.form.controls.date.value;
    if (!date || this.rows().length === 0) {
      return;
    }
    if (this.rows().some((row) => !row.statusId)) {
      this.toast.error('Select a status for every employee.');
      return;
    }

    this.saving.set(true);
    this.employeeAttendanceService
      .markEmployeeAttendance({
        attendanceDate: date,
        entries: this.rows().map((row) => ({
          employeeId: row.employeeId,
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
