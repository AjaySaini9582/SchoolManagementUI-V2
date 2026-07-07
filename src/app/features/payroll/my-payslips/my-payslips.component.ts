import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { PayrollListItem } from '../../../core/models/payroll.model';
import { PayrollService } from '../../../core/services/payroll.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

@Component({
  selector: 'app-my-payslips',
  standalone: true,
  imports: [DatePipe, DecimalPipe, EmptyStateComponent, MatButtonModule, MatIconModule, SkeletonComponent],
  templateUrl: './my-payslips.component.html',
  styleUrl: './my-payslips.component.scss',
})
export class MyPayslipsComponent implements OnInit {
  private readonly payrollService = inject(PayrollService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly payslips = signal<PayrollListItem[]>([]);

  ngOnInit(): void {
    this.payrollService.getMyPayslips().subscribe({
      next: (response) => {
        this.payslips.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load your payslips.');
      },
    });
  }

  monthLabel(row: PayrollListItem): string {
    return `${MONTH_NAMES[row.payrollMonth - 1]} ${row.payrollYear}`;
  }

  view(row: PayrollListItem): void {
    this.router.navigateByUrl(`/payroll/payslip?id=${row.id}`);
  }
}
