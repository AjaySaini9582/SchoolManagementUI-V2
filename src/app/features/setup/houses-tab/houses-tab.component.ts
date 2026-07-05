import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { HouseDTO } from '../../../core/models/setup.model';
import { SetupService } from '../../../core/services/setup.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-houses-tab',
  standalone: true,
  imports: [
    EmptyStateComponent,
    FieldErrorComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './houses-tab.component.html',
  styleUrl: './houses-tab.component.scss',
})
export class HousesTabComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly houses = signal<HouseDTO[]>([]);
  readonly displayedColumns = ['color', 'name', 'status', 'actions'];

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    color: ['#7c3aed', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.setupService.getAllHouse().subscribe({
      next: (response) => {
        this.houses.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load houses.');
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', color: '#7c3aed' });
    this.showForm.set(true);
  }

  openEdit(house: HouseDTO): void {
    this.editingId.set(house.id);
    this.form.reset({ name: house.name, color: house.color ?? '#7c3aed' });
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
    this.setupService.createOrUpdateHouse({ id: this.editingId() ?? 0, name: value.name, color: value.color, isActive: true }).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) {
          this.toast.success('House saved.');
          this.showForm.set(false);
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to save house.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to save house right now.');
      },
    });
  }

  confirmDeactivate(house: HouseDTO): void {
    this.confirmDialog
      .confirm({ title: 'Deactivate house', message: `Deactivate "${house.name}"?`, confirmLabel: 'Deactivate', danger: true })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.setupService.deactiveHouseById(house.id).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('House deactivated.');
              this.load();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to deactivate house.');
            }
          },
          error: () => this.toast.error('Unable to deactivate house right now.'),
        });
      });
  }
}
