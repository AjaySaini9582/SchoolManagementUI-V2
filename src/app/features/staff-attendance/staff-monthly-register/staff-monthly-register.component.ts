import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { EmployeeMonthlyAttendanceRegisterDTO } from '../../../core/models/employee-attendance.model';
import { DepartmentResponseDTO } from '../../../core/models/setup.model';
import { EmployeeAttendanceService } from '../../../core/services/employee-attendance.service';
import { SetupService } from '../../../core/services/setup.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

function toMonthInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

const STATUS_ABBREVIATIONS: Record<string, string> = {
  Present: 'P',
  Absent: 'A',
  Leave: 'L',
  Holiday: 'H',
  'Half Day': 'HD',
};

@Component({
  selector: 'app-staff-monthly-register',
  standalone: true,
  imports: [EmptyStateComponent, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule, SkeletonComponent],
  templateUrl: './staff-monthly-register.component.html',
  styleUrl: './staff-monthly-register.component.scss',
})
export class StaffMonthlyRegisterComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly employeeAttendanceService = inject(EmployeeAttendanceService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly loadingRegister = signal(false);
  readonly departments = signal<DepartmentResponseDTO[]>([]);
  readonly register = signal<EmployeeMonthlyAttendanceRegisterDTO | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    departmentId: [null as number | null],
    month: [toMonthInput(new Date())],
  });

  readonly dayNumbers = computed(() => {
    const value = this.register();
    if (!value) {
      return [];
    }
    const daysInMonth = new Date(value.year, value.month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => index + 1);
  });

  ngOnInit(): void {
    this.setupService.getAllDepartment().subscribe({
      next: (response) => {
        this.departments.set(response.data ?? []);
        this.loading.set(false);
        this.loadRegister();
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load departments.');
      },
    });

    this.form.controls.departmentId.valueChanges.subscribe(() => this.loadRegister());
    this.form.controls.month.valueChanges.subscribe(() => this.loadRegister());
  }

  abbreviate(statusName: string | null): string {
    if (!statusName) {
      return '';
    }
    return STATUS_ABBREVIATIONS[statusName] ?? statusName.charAt(0);
  }

  statusClass(statusName: string | null): string {
    if (!statusName) {
      return '';
    }
    return statusName.toLowerCase().replace(' ', '-');
  }

  private loadRegister(): void {
    const departmentId = this.form.controls.departmentId.value;
    const monthValue = this.form.controls.month.value;
    this.register.set(null);
    if (!monthValue) {
      return;
    }

    const [year, month] = monthValue.split('-').map(Number);
    this.loadingRegister.set(true);
    this.employeeAttendanceService.getEmployeeMonthlyRegister(year, month, departmentId).subscribe({
      next: (response) => {
        this.register.set(response.data ?? null);
        this.loadingRegister.set(false);
      },
      error: () => {
        this.loadingRegister.set(false);
        this.toast.error('Unable to load the monthly register.');
      },
    });
  }
}
