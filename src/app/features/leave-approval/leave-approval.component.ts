import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { EmployeeLeaveListItem, LEAVE_STATUS, LEAVE_STATUS_LABEL } from '../../core/models/employee-leave.model';
import { EmployeeLeaveService } from '../../core/services/employee-leave.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-leave-approval',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent, MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule, SkeletonComponent],
  templateUrl: './leave-approval.component.html',
  styleUrl: './leave-approval.component.scss',
})
export class LeaveApprovalComponent implements OnInit {
  private readonly employeeLeaveService = inject(EmployeeLeaveService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly LEAVE_STATUS_LABEL = LEAVE_STATUS_LABEL;
  readonly LEAVE_STATUS = LEAVE_STATUS;

  readonly loading = signal(true);
  readonly filterStatus = signal<number | null>(LEAVE_STATUS.Pending);
  readonly leaves = signal<EmployeeLeaveListItem[]>([]);

  ngOnInit(): void {
    this.load();
  }

  onFilterChange(status: number | null): void {
    this.filterStatus.set(status);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.employeeLeaveService.getAllLeaveRequests(this.filterStatus()).subscribe({
      next: (response) => {
        this.leaves.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load leave requests.');
      },
    });
  }

  approve(leave: EmployeeLeaveListItem): void {
    this.confirmDialog
      .confirm({ title: 'Approve leave', message: `Approve ${leave.employeeName}'s ${(leave.leaveType ?? 'leave').toLowerCase()} (${leave.totalDays} day(s))?`, confirmLabel: 'Approve' })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.verify(leave, true, null);
      });
  }

  reject(leave: EmployeeLeaveListItem): void {
    this.confirmDialog
      .confirm({
        title: 'Reject leave',
        message: `Reject ${leave.employeeName}'s leave request?`,
        requireReason: true,
        reasonLabel: 'Rejection Reason',
        confirmLabel: 'Reject',
        danger: true,
      })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.verify(leave, false, result.reason ?? '');
      });
  }

  private verify(leave: EmployeeLeaveListItem, approve: boolean, rejectionReason: string | null): void {
    this.employeeLeaveService.verifyLeave({ id: leave.id, approve, rejectionReason }).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success(approve ? 'Leave approved.' : 'Leave rejected.');
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to update this leave request.');
        }
      },
      error: () => this.toast.error('Unable to update this leave request right now.'),
    });
  }
}
