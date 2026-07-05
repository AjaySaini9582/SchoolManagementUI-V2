import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';

import { ReportCardDTO } from '../../../core/models/exam.model';
import { ExamService } from '../../../core/services/exam.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [EmptyStateComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './report-card.component.html',
  styleUrl: './report-card.component.scss',
})
export class ReportCardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly examService = inject(ExamService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly reportCard = signal<ReportCardDTO | null>(null);

  ngOnInit(): void {
    const studentId = Number(this.route.snapshot.queryParamMap.get('studentId') ?? 0);
    const examTypeId = Number(this.route.snapshot.queryParamMap.get('examTypeId') ?? 0);

    if (!studentId || !examTypeId) {
      this.loading.set(false);
      return;
    }

    this.examService.getReportCard(studentId, examTypeId).subscribe({
      next: (response) => {
        this.reportCard.set(response.data ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load this report card.');
      },
    });
  }

  print(): void {
    window.print();
  }

  back(): void {
    this.router.navigateByUrl('/exam');
  }
}
