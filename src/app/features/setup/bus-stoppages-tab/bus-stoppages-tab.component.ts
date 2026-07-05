import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { CreateBusStoppageDTO } from '../../../core/models/setup.model';
import { MasterApiResponseDTO } from '../../../core/models/shared.model';
import { SetupService } from '../../../core/services/setup.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-bus-stoppages-tab',
  standalone: true,
  imports: [
    EmptyStateComponent,
    FieldErrorComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './bus-stoppages-tab.component.html',
  styleUrl: './bus-stoppages-tab.component.scss',
})
export class BusStoppagesTabComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly stoppages = signal<CreateBusStoppageDTO[]>([]);
  readonly routes = signal<MasterApiResponseDTO[]>([]);
  readonly displayedColumns = ['name', 'route', 'arrivalTime', 'dispatchTime', 'distance', 'amount', 'status', 'actions'];

  readonly form = this.formBuilder.nonNullable.group({
    busRoutId: [null as number | null, Validators.required],
    name: ['', Validators.required],
    arrivalTime: ['', Validators.required],
    dispatchTime: ['', Validators.required],
    distance: [0, Validators.required],
    amount: [0, Validators.required],
  });

  ngOnInit(): void {
    this.load();
    this.setupService.getAllBusRoutes().subscribe((response) => this.routes.set(response.data ?? []));
  }

  load(): void {
    this.loading.set(true);
    this.setupService.getAllBusStoppage().subscribe({
      next: (response) => {
        this.stoppages.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load bus stoppages.');
      },
    });
  }

  routeName(routeId: number): string {
    return this.routes().find((route) => route.id === routeId)?.name ?? '—';
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ busRoutId: null, name: '', arrivalTime: '', dispatchTime: '', distance: 0, amount: 0 });
    this.showForm.set(true);
  }

  openEdit(stoppage: CreateBusStoppageDTO): void {
    this.editingId.set(stoppage.id);
    this.form.reset({
      busRoutId: stoppage.busRoutId,
      name: stoppage.name,
      arrivalTime: stoppage.arrivalTime,
      dispatchTime: stoppage.dispatchTime,
      distance: stoppage.distance,
      amount: stoppage.amount,
    });
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.setupService
      .createOrUpdateBusStoppage({
        id: this.editingId() ?? 0,
        busRoutId: value.busRoutId as number,
        name: value.name,
        arrivalTime: value.arrivalTime,
        dispatchTime: value.dispatchTime,
        distance: value.distance,
        amount: value.amount,
        isActive: true,
      })
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.isSuccess) {
            this.toast.success('Bus stoppage saved.');
            this.showForm.set(false);
            this.load();
          } else {
            this.toast.error(response.errorMessage ?? 'Unable to save bus stoppage.');
          }
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Unable to save bus stoppage right now.');
        },
      });
  }

  confirmDeactivate(stoppage: CreateBusStoppageDTO): void {
    this.confirmDialog
      .confirm({
        title: 'Deactivate stoppage',
        message: `Deactivate "${stoppage.name}"?`,
        confirmLabel: 'Deactivate',
        danger: true,
      })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.setupService.deactiveBusStoppagesById(stoppage.id).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Bus stoppage deactivated.');
              this.load();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to deactivate stoppage.');
            }
          },
          error: () => this.toast.error('Unable to deactivate stoppage right now.'),
        });
      });
  }
}
