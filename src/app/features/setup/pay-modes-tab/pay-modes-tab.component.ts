import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { PaymentModeRequest } from '../../../core/models/setup.model';
import { MasterApiResponseDTO } from '../../../core/models/shared.model';
import { SetupService } from '../../../core/services/setup.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

/** No `deactivatePayMode` endpoint exists on the backend — create/edit only. */
@Component({
  selector: 'app-pay-modes-tab',
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
  templateUrl: './pay-modes-tab.component.html',
  styleUrl: './pay-modes-tab.component.scss',
})
export class PayModesTabComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly payModes = signal<PaymentModeRequest[]>([]);
  readonly categories = signal<MasterApiResponseDTO[]>([]);
  readonly displayedColumns = ['category', 'type', 'openingBalance', 'status', 'actions'];

  readonly form = this.formBuilder.nonNullable.group({
    categoryId: [null as number | null, Validators.required],
    type: ['', Validators.required],
    openingBalance: [0, Validators.required],
  });

  ngOnInit(): void {
    this.load();
    this.setupService.getAllPaymentCategoryMaster().subscribe((response) => this.categories.set(response.data ?? []));
  }

  load(): void {
    this.loading.set(true);
    this.setupService.getAllPayMode().subscribe({
      next: (response) => {
        this.payModes.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load pay modes.');
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ categoryId: null, type: '', openingBalance: 0 });
    this.showForm.set(true);
  }

  openEdit(mode: PaymentModeRequest): void {
    this.editingId.set(mode.id);
    this.form.reset({ categoryId: mode.categoryId, type: mode.type, openingBalance: mode.openingBalance });
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
      .createOrUpdatePayMode({
        id: this.editingId() ?? 0,
        categoryId: value.categoryId as number,
        type: value.type,
        openingBalance: value.openingBalance,
        isActive: true,
      })
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.isSuccess) {
            this.toast.success('Pay mode saved.');
            this.showForm.set(false);
            this.load();
          } else {
            this.toast.error(response.errorMessage ?? 'Unable to save pay mode.');
          }
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Unable to save pay mode right now.');
        },
      });
  }

  categoryName(categoryId: number): string {
    return this.categories().find((category) => category.id === categoryId)?.name ?? '—';
  }
}
