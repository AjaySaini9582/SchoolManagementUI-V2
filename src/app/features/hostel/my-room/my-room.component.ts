import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { HostelAllocationListItem } from '../../../core/models/hostel.model';
import { HostelService } from '../../../core/services/hostel.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-my-room',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent, SkeletonComponent],
  templateUrl: './my-room.component.html',
  styleUrl: './my-room.component.scss',
})
export class MyRoomComponent implements OnInit {
  private readonly hostelService = inject(HostelService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly allocation = signal<HostelAllocationListItem | null>(null);

  ngOnInit(): void {
    this.hostelService.getMyAllocation().subscribe({
      next: (response) => {
        this.allocation.set(response.data ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load your room allocation.');
      },
    });
  }
}
