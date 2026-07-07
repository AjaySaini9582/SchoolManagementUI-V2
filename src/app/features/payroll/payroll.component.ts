import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

import { PAYROLL_STATUS, PAYROLL_STATUS_LABEL, PayrollListItem } from '../../core/models/payroll.model';
import { PayrollService } from '../../core/services/payroll.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { ToastService } from '../../shared/toast/toast.service';

function toMonthInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [DecimalPipe, EmptyStateComponent, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTableModule, ReactiveFormsModule, SkeletonComponent],
  templateUrl: './payroll.component.html',
  styleUrl: './payroll.component.scss',
})
export class PayrollComponent implements OnInit {
  private readonly payrollService = inject(PayrollService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly PAYROLL_STATUS = PAYROLL_STATUS;
  readonly PAYROLL_STATUS_LABEL = PAYROLL_STATUS_LABEL;

  readonly loading = signal(false);
  readonly generating = signal(false);
  readonly rows = signal<PayrollListItem[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly editingDeduction = signal<number>(0);
  readonly displayedColumns = ['employee', 'basic', 'epf', 'eps', 'lop', 'otherDeductions', 'net', 'status', 'actions'];

  readonly form = this.formBuilder.nonNullable.group({
    month: [toMonthInput(new Date())],
  });

  ngOnInit(): void {
    this.load();
    this.form.controls.month.valueChanges.subscribe(() => this.load());
  }

  private currentMonthYear(): { month: number; year: number } | null {
    const value = this.form.controls.month.value;
    if (!value) {
      return null;
    }
    const [year, month] = value.split('-').map(Number);
    return { month, year };
  }

  private load(): void {
    const period = this.currentMonthYear();
    if (!period) {
      return;
    }
    this.loading.set(true);
    this.payrollService.getPayrollList(period.month, period.year).subscribe({
      next: (response) => {
        this.rows.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load payroll.');
      },
    });
  }

  generate(): void {
    const period = this.currentMonthYear();
    if (!period) {
      return;
    }
    this.generating.set(true);
    this.payrollService.generatePayroll(period.month, period.year).subscribe({
      next: (response) => {
        this.generating.set(false);
        if (response.isSuccess) {
          const count = response.data?.generatedCount ?? 0;
          this.toast.success(count > 0 ? `Generated payroll for ${count} employee(s).` : (response.errorMessage ?? 'Nothing new to generate.'));
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to generate payroll.');
        }
      },
      error: () => {
        this.generating.set(false);
        this.toast.error('Unable to generate payroll right now.');
      },
    });
  }

  startEditDeduction(row: PayrollListItem): void {
    this.editingId.set(row.id);
    this.editingDeduction.set(row.otherDeductions);
  }

  cancelEditDeduction(): void {
    this.editingId.set(null);
  }

  saveDeduction(row: PayrollListItem): void {
    this.payrollService.updatePayrollDeduction({ id: row.id, otherDeductions: this.editingDeduction() }).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success('Deduction updated.');
          this.editingId.set(null);
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to update deduction.');
        }
      },
      error: () => this.toast.error('Unable to update deduction right now.'),
    });
  }

  markPaid(row: PayrollListItem): void {
    this.confirmDialog
      .confirm({ title: 'Mark as paid', message: `Mark ${row.employeeName}'s salary as paid?`, confirmLabel: 'Mark Paid' })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.payrollService.markPayrollPaid(row.id).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Marked as paid.');
              this.load();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to mark as paid.');
            }
          },
          error: () => this.toast.error('Unable to mark as paid right now.'),
        });
      });
  }

  viewPayslip(row: PayrollListItem): void {
    this.router.navigateByUrl(`/payroll/payslip?id=${row.id}`);
  }
}
