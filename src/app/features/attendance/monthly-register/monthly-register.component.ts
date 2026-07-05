import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { MonthlyAttendanceRegisterDTO } from '../../../core/models/attendance.model';
import { ClassWithSectionsDto } from '../../../core/models/setup.model';
import { AttendanceService } from '../../../core/services/attendance.service';
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
  selector: 'app-monthly-register',
  standalone: true,
  imports: [EmptyStateComponent, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule, SkeletonComponent],
  templateUrl: './monthly-register.component.html',
  styleUrl: './monthly-register.component.scss',
})
export class MonthlyRegisterComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly loadingRegister = signal(false);
  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly register = signal<MonthlyAttendanceRegisterDTO | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    classSectionId: [null as number | null, Validators.required],
    month: [toMonthInput(new Date()), Validators.required],
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

    this.form.controls.classSectionId.valueChanges.subscribe(() => this.loadRegister());
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
    const classSectionId = this.form.controls.classSectionId.value;
    const monthValue = this.form.controls.month.value;
    this.register.set(null);
    if (!classSectionId || !monthValue) {
      return;
    }

    const [year, month] = monthValue.split('-').map(Number);
    this.loadingRegister.set(true);
    this.attendanceService.getMonthlyRegister(classSectionId, year, month).subscribe({
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
