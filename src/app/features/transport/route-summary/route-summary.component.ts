import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouteSummaryDTO } from '../../../core/models/transport.model';
import { TransportService } from '../../../core/services/transport.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-route-summary',
  standalone: true,
  imports: [EmptyStateComponent, SkeletonComponent],
  templateUrl: './route-summary.component.html',
  styleUrl: './route-summary.component.scss',
})
export class RouteSummaryComponent implements OnInit {
  private readonly transportService = inject(TransportService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly routes = signal<RouteSummaryDTO[]>([]);

  readonly totalStudents = computed(() =>
    this.routes().reduce((sum, route) => sum + route.stoppages.reduce((stopSum, stoppage) => stopSum + stoppage.studentCount, 0), 0),
  );

  ngOnInit(): void {
    this.transportService.getTransportSummary().subscribe({
      next: (response) => {
        this.routes.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load the transport summary.');
      },
    });
  }

  routeTotal(route: RouteSummaryDTO): number {
    return route.stoppages.reduce((sum, stoppage) => sum + stoppage.studentCount, 0);
  }
}
