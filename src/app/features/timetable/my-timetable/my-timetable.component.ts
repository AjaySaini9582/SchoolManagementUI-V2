import { Component, OnInit, inject, signal } from '@angular/core';

import { DAYS_OF_WEEK, TimetablePeriodListItem } from '../../../core/models/timetable.model';
import { TimetableService } from '../../../core/services/timetable.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-my-timetable',
  standalone: true,
  imports: [EmptyStateComponent, SkeletonComponent],
  templateUrl: './my-timetable.component.html',
  styleUrl: './my-timetable.component.scss',
})
export class MyTimetableComponent implements OnInit {
  private readonly timetableService = inject(TimetableService);
  private readonly toast = inject(ToastService);

  readonly days = DAYS_OF_WEEK;
  readonly loading = signal(true);
  readonly periods = signal<TimetablePeriodListItem[]>([]);

  ngOnInit(): void {
    this.timetableService.getMyTimetable().subscribe({
      next: (response) => {
        this.periods.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load your timetable.');
      },
    });
  }

  periodsForDay(dayOfWeek: number): TimetablePeriodListItem[] {
    return this.periods()
      .filter((p) => p.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.periodNumber - b.periodNumber);
  }
}
