import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';

import { CreateBusStoppageDTO } from '../../../core/models/setup.model';
import { MasterApiResponseDTO } from '../../../core/models/shared.model';
import { TransportRosterRow } from '../../../core/models/transport.model';
import { SetupService } from '../../../core/services/setup.service';
import { TransportService } from '../../../core/services/transport.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-transport-roster',
  standalone: true,
  imports: [EmptyStateComponent, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, SkeletonComponent],
  templateUrl: './transport-roster.component.html',
  styleUrl: './transport-roster.component.scss',
})
export class TransportRosterComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly transportService = inject(TransportService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly loadingRoster = signal(false);

  readonly busRoutes = signal<MasterApiResponseDTO[]>([]);
  readonly busStoppages = signal<CreateBusStoppageDTO[]>([]);
  readonly roster = signal<TransportRosterRow[]>([]);

  readonly form = this.formBuilder.nonNullable.group({
    busRouteId: [null as number | null, Validators.required],
    busStoppageId: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    forkJoin({
      busRoutes: this.setupService.getAllBusRoutes(),
      busStoppages: this.setupService.getAllBusStoppage(),
    }).subscribe({
      next: (result) => {
        this.busRoutes.set((result.busRoutes.data ?? []).filter((route) => route.isActive));
        this.busStoppages.set((result.busStoppages.data ?? []).filter((stoppage) => stoppage.isActive));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load bus routes.');
      },
    });

    this.form.controls.busRouteId.valueChanges.subscribe(() => {
      this.form.controls.busStoppageId.setValue(null);
      this.roster.set([]);
    });
    this.form.controls.busStoppageId.valueChanges.subscribe(() => this.loadRoster());
  }

  stoppagesForSelectedRoute(): CreateBusStoppageDTO[] {
    const busRouteId = this.form.controls.busRouteId.value;
    return this.busStoppages().filter((stoppage) => stoppage.busRoutId === busRouteId);
  }

  private loadRoster(): void {
    const busStoppageId = this.form.controls.busStoppageId.value;
    this.roster.set([]);
    if (!busStoppageId) {
      return;
    }
    this.loadingRoster.set(true);
    this.transportService.getStudentsByStoppage(busStoppageId).subscribe({
      next: (response) => {
        this.roster.set(response.data ?? []);
        this.loadingRoster.set(false);
      },
      error: () => {
        this.loadingRoster.set(false);
        this.toast.error('Unable to load the stoppage roster.');
      },
    });
  }
}
