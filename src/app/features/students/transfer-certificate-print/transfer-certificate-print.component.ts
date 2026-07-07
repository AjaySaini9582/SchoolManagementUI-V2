import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { TransferCertificate } from '../../../core/models/transfer-certificate.model';
import { SchoolProfileContextService } from '../../../core/services/school-profile-context.service';
import { TransferCertificateService } from '../../../core/services/transfer-certificate.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-transfer-certificate-print',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './transfer-certificate-print.component.html',
  styleUrl: './transfer-certificate-print.component.scss',
})
export class TransferCertificatePrintComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly transferCertificateService = inject(TransferCertificateService);
  private readonly toast = inject(ToastService);

  private readonly schoolProfileContext = inject(SchoolProfileContextService);
  readonly schoolProfile = this.schoolProfileContext.schoolProfile;
  readonly letterheadUrl = this.schoolProfileContext.letterheadUrl;
  readonly logoUrl = this.schoolProfileContext.logoUrl;

  readonly loading = signal(true);
  readonly certificate = signal<TransferCertificate | null>(null);

  ngOnInit(): void {
    const studentId = Number(this.route.snapshot.queryParamMap.get('studentId') ?? 0);
    if (!studentId) {
      this.loading.set(false);
      return;
    }

    forkJoin({
      certificate: this.transferCertificateService.getTransferCertificate(studentId),
      schoolProfile: this.schoolProfileContext.load(),
    }).subscribe({
      next: (result) => {
        this.certificate.set(result.certificate.data ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load the transfer certificate.');
      },
    });
  }

  print(): void {
    window.print();
  }

  back(): void {
    this.router.navigateByUrl('/students');
  }
}
