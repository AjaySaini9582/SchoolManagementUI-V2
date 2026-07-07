import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

import { PayrollListItem } from '../../../core/models/payroll.model';
import { PayrollService } from '../../../core/services/payroll.service';
import { SchoolProfileContextService } from '../../../core/services/school-profile-context.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-payslip-print',
  standalone: true,
  imports: [DatePipe, DecimalPipe, EmptyStateComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './payslip-print.component.html',
  styleUrl: './payslip-print.component.scss',
})
export class PayslipPrintComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly payrollService = inject(PayrollService);
  private readonly toast = inject(ToastService);

  private readonly schoolProfileContext = inject(SchoolProfileContextService);
  readonly schoolProfile = this.schoolProfileContext.schoolProfile;
  readonly letterheadUrl = this.schoolProfileContext.letterheadUrl;
  readonly logoUrl = this.schoolProfileContext.logoUrl;

  readonly loading = signal(true);
  readonly payslip = signal<PayrollListItem | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('id') ?? 0);
    if (!id) {
      this.loading.set(false);
      return;
    }

    forkJoin({
      payslip: this.payrollService.getPayslip(id),
      schoolProfile: this.schoolProfileContext.load(),
    }).subscribe({
      next: (result) => {
        this.payslip.set(result.payslip.data ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load this payslip.');
      },
    });
  }

  monthLabel(): string {
    const row = this.payslip();
    return row ? `${MONTH_NAMES[row.payrollMonth - 1]} ${row.payrollYear}` : '';
  }

  print(): void {
    window.print();
  }

  back(): void {
    this.location.back();
  }
}
