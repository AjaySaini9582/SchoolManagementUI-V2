import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin } from 'rxjs';

import { FeeCollectionReportDTO, FeeReceiptDTO } from '../../../core/models/fee.model';
import { FeeService } from '../../../core/services/fee.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

function toLocalDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-collection-report',
  standalone: true,
  imports: [BaseChartDirective, EmptyStateComponent, MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, SkeletonComponent],
  templateUrl: './collection-report.component.html',
  styleUrl: './collection-report.component.scss',
})
export class CollectionReportComponent implements OnInit {
  private readonly feeService = inject(FeeService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly report = signal<FeeCollectionReportDTO | null>(null);
  readonly receipts = signal<FeeReceiptDTO[]>([]);

  readonly form = this.formBuilder.nonNullable.group({
    fromDate: [toLocalDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), Validators.required],
    toDate: [toLocalDateInput(new Date()), Validators.required],
  });

  readonly chartData = computed<ChartData<'bar'>>(() => {
    const rows = this.report()?.byPaymode ?? [];
    return {
      labels: rows.map((row) => row.paymodeType ?? ''),
      datasets: [{ label: 'Collected', data: rows.map((row) => row.totalCollected), backgroundColor: '#7c3aed' }],
    };
  });

  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  ngOnInit(): void {
    this.runReport();
  }

  runReport(): void {
    if (this.form.invalid) {
      return;
    }
    const { fromDate, toDate } = this.form.getRawValue();
    this.loading.set(true);
    forkJoin({
      report: this.feeService.getCollectionReport(fromDate, toDate),
      receipts: this.feeService.getCollectionReceipts(fromDate, toDate),
    }).subscribe({
      next: ({ report, receipts }) => {
        this.report.set(report.data ?? null);
        this.receipts.set(receipts.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load the collection report.');
      },
    });
  }

  sendReminders(): void {
    this.confirmDialog
      .confirm({
        title: 'Send fee due reminders',
        message: 'This will email/SMS every parent with an outstanding fee balance. Continue?',
        confirmLabel: 'Send Reminders',
      })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.sending.set(true);
        this.feeService.sendFeeDueReminders().subscribe({
          next: (response) => {
            this.sending.set(false);
            if (response.isSuccess) {
              this.toast.success(`Reminders sent to ${response.data} parent(s).`);
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to send reminders.');
            }
          },
          error: () => {
            this.sending.set(false);
            this.toast.error('Unable to send reminders right now.');
          },
        });
      });
  }
}
