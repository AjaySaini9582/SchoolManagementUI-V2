import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { DashboardSummaryDTO } from '../../core/models/dashboard.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { SessionContextService } from '../../core/services/session-context.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { StatTileComponent } from '../../shared/stat-tile/stat-tile.component';
import { ToastService } from '../../shared/toast/toast.service';

/** Follows the topbar's session switcher reactively (via the `activeSession`
 * signal) rather than snapshotting it once, so an Admin switching sessions in
 * the topbar immediately refreshes these stats — there is deliberately no
 * second, separate session picker on this page anymore, since two controls
 * both labeled "Session" (one live-reactive, one not) was confusing and the
 * non-reactive one looked like the only one that "worked". */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BaseChartDirective, DecimalPipe, EmptyStateComponent, SkeletonComponent, StatTileComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly sessionContext = inject(SessionContextService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly summary = signal<DashboardSummaryDTO | null>(null);

  constructor() {
    effect(
      () => {
        const session = this.sessionContext.activeSession();
        this.loadSummary(session?.id ?? null);
      },
      { allowSignalWrites: true },
    );
  }

  readonly chartData = computed<ChartData<'bar'>>(() => {
    const rows = this.summary()?.enrollmentByClass ?? [];
    return {
      labels: rows.map((row) => `${row.className ?? ''} ${row.sectionName ?? ''}`.trim()),
      datasets: [{ label: 'Students', data: rows.map((row) => row.studentCount), backgroundColor: '#7c3aed' }],
    };
  });

  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  ngOnInit(): void {
    // Only kicks off the fetch that populates `sessionContext.activeSession` —
    // the `effect()` above reacts to that signal and loads the actual
    // dashboard summary, both now and whenever the topbar switches sessions.
    this.sessionContext.load().subscribe({ error: () => this.loading.set(false) });
  }

  private loadSummary(sessionId: number | null): void {
    this.loading.set(true);
    this.dashboardService.getDashboardSummary(sessionId).subscribe({
      next: (response) => {
        this.summary.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load dashboard data.');
      },
    });
  }
}
