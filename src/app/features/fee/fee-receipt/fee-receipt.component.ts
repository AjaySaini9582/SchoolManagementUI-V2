import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';

import { FeeReceiptDTO } from '../../../core/models/fee.model';
import { FeeService } from '../../../core/services/fee.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-fee-receipt',
  standalone: true,
  imports: [EmptyStateComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './fee-receipt.component.html',
  styleUrl: './fee-receipt.component.scss',
})
export class FeeReceiptComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly feeService = inject(FeeService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly receipt = signal<FeeReceiptDTO | null>(null);

  ngOnInit(): void {
    const studentId = Number(this.route.snapshot.queryParamMap.get('studentId') ?? 0);
    const receiptId = Number(this.route.snapshot.queryParamMap.get('receiptId') ?? 0);

    if (!studentId || !receiptId) {
      this.loading.set(false);
      return;
    }

    this.feeService.getReceiptsByStudent(studentId).subscribe({
      next: (response) => {
        const match = (response.data ?? []).find((item) => item.id === receiptId) ?? null;
        this.receipt.set(match);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load this receipt.');
      },
    });
  }

  print(): void {
    window.print();
  }

  back(): void {
    this.router.navigateByUrl('/fee');
  }
}
