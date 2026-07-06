import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { HomeworkListItem } from '../../../core/models/homework.model';
import { HomeworkService } from '../../../core/services/homework.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-my-homework',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent, SkeletonComponent],
  templateUrl: './my-homework.component.html',
  styleUrl: './my-homework.component.scss',
})
export class MyHomeworkComponent implements OnInit {
  private readonly homeworkService = inject(HomeworkService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly homework = signal<HomeworkListItem[]>([]);

  ngOnInit(): void {
    this.homeworkService.getMyHomework().subscribe({
      next: (response) => {
        this.homework.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load homework.');
      },
    });
  }
}
