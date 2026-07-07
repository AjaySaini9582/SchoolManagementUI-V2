import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';

import { EmployeeLeave, EmployeeLeaveBalanceDTO, EmployeeLeaveListItem, LEAVE_STATUS_LABEL } from '../../core/models/employee-leave.model';
import { EmployeeLeaveService } from '../../core/services/employee-leave.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../shared/field-error/field-error.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-my-leave',
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
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './my-leave.component.html',
  styleUrl: './my-leave.component.scss',
})
export class MyLeaveComponent implements OnInit {
  private readonly employeeLeaveService = inject(EmployeeLeaveService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly LEAVE_STATUS_LABEL = LEAVE_STATUS_LABEL;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly balance = signal<EmployeeLeaveBalanceDTO | null>(null);
  readonly leaves = signal<EmployeeLeaveListItem[]>([]);

  readonly form = this.formBuilder.nonNullable.group({
    leaveType: ['Casual Leave', Validators.required],
    fromDate: ['', Validators.required],
    toDate: ['', Validators.required],
    reason: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      balance: this.employeeLeaveService.getMyLeaveBalance(),
      leaves: this.employeeLeaveService.getMyLeaves(),
    }).subscribe({
      next: (result) => {
        this.balance.set(result.balance.data ?? null);
        this.leaves.set(result.leaves.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load your leave records.');
      },
    });
  }

  openApply(): void {
    this.form.reset({ leaveType: 'Casual Leave', fromDate: '', toDate: '', reason: '' });
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
    if (value.toDate < value.fromDate) {
      this.toast.error('The end date cannot be before the start date.');
      return;
    }

    const leave: EmployeeLeave = {
      id: 0,
      leaveType: value.leaveType,
      fromDate: value.fromDate,
      toDate: value.toDate,
      reason: value.reason || null,
    };

    this.saving.set(true);
    this.employeeLeaveService.applyLeave(leave).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) {
          this.toast.success('Leave application submitted.');
          this.showForm.set(false);
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to submit your leave application.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to submit your leave application right now.');
      },
    });
  }
}
