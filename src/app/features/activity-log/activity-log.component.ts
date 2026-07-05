import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';

import { ActivityLogEntry } from '../../core/models/activity-log.model';
import { ActivityLogService } from '../../core/services/activity-log.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { ToastService } from '../../shared/toast/toast.service';

const MAX_RESULTS = 500;
const PAGE_SIZE = 20;

const ENTITY_TYPES = ['Student', 'Employee', 'FeeReceipt', 'ExamMarks', 'Attendance'] as const;

function toLocalDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [
    EmptyStateComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './activity-log.component.html',
  styleUrl: './activity-log.component.scss',
})
export class ActivityLogComponent implements OnInit {
  private readonly activityLogService = inject(ActivityLogService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly entityTypes = ENTITY_TYPES;

  readonly loading = signal(true);
  readonly entries = signal<ActivityLogEntry[]>([]);
  readonly entityTypeFilter = signal<string | null>(null);
  readonly pageIndex = signal(0);

  readonly form = this.formBuilder.nonNullable.group({
    fromDate: [toLocalDateInput(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), Validators.required],
    toDate: [toLocalDateInput(new Date()), Validators.required],
  });

  readonly filteredEntries = computed(() => {
    const type = this.entityTypeFilter();
    const all = this.entries();
    return type ? all.filter((entry) => entry.entityType === type) : all;
  });

  readonly pagedEntries = computed(() => {
    const start = this.pageIndex() * PAGE_SIZE;
    return this.filteredEntries().slice(start, start + PAGE_SIZE);
  });

  ngOnInit(): void {
    this.run();
  }

  run(): void {
    if (this.form.invalid) {
      return;
    }
    const { fromDate, toDate } = this.form.getRawValue();
    this.loading.set(true);
    this.activityLogService.getRecentActivity(fromDate, toDate, MAX_RESULTS).subscribe({
      next: (response) => {
        this.entries.set(response.data ?? []);
        this.pageIndex.set(0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load the activity log.');
      },
    });
  }

  onEntityTypeChange(value: string | null): void {
    this.entityTypeFilter.set(value);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }
}
