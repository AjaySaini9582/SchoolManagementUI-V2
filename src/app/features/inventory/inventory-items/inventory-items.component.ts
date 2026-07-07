import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import {
  INVENTORY_TRANSACTION_TYPE,
  InventoryItem,
  InventoryItemListItem,
} from '../../../core/models/inventory.model';
import { InventoryService } from '../../../core/services/inventory.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-inventory-items',
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
  templateUrl: './inventory-items.component.html',
  styleUrl: './inventory-items.component.scss',
})
export class InventoryItemsComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly INVENTORY_TRANSACTION_TYPE = INVENTORY_TRANSACTION_TYPE;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly recording = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly transactingItem = signal<InventoryItemListItem | null>(null);
  readonly items = signal<InventoryItemListItem[]>([]);
  readonly displayedColumns = ['name', 'category', 'stock', 'actions'];

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    category: [''],
    unit: [''],
    reorderLevel: [0, [Validators.required, Validators.min(0)]],
  });

  readonly transactionForm = this.formBuilder.nonNullable.group({
    transactionType: [INVENTORY_TRANSACTION_TYPE.In, Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    remark: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.inventoryService.getItemList().subscribe({
      next: (response) => {
        this.items.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load inventory items.');
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', category: '', unit: '', reorderLevel: 0 });
    this.transactingItem.set(null);
    this.showForm.set(true);
  }

  openEdit(row: InventoryItemListItem): void {
    this.editingId.set(row.id);
    this.form.reset({ name: row.name ?? '', category: row.category ?? '', unit: row.unit ?? '', reorderLevel: row.reorderLevel });
    this.transactingItem.set(null);
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.transactingItem.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const item: InventoryItem = {
      id: this.editingId() ?? 0,
      name: value.name,
      category: value.category || null,
      unit: value.unit || null,
      reorderLevel: value.reorderLevel,
      isActive: true,
    };

    this.saving.set(true);
    this.inventoryService.createOrUpdateItem(item).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) {
          this.toast.success('Item saved.');
          this.showForm.set(false);
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to save this item.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to save this item right now.');
      },
    });
  }

  confirmDeactivate(row: InventoryItemListItem): void {
    this.confirmDialog
      .confirm({ title: 'Remove item', message: `Remove "${row.name}" from inventory?`, confirmLabel: 'Remove', danger: true })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.inventoryService.deactivateItem(row.id).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Item removed.');
              this.load();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to remove this item.');
            }
          },
          error: () => this.toast.error('Unable to remove this item right now.'),
        });
      });
  }

  openTransaction(row: InventoryItemListItem): void {
    this.showForm.set(false);
    this.transactingItem.set(row);
    this.transactionForm.reset({ transactionType: INVENTORY_TRANSACTION_TYPE.In, quantity: 1, remark: '' });
  }

  recordTransaction(): void {
    const item = this.transactingItem();
    if (!item || this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }
    const value = this.transactionForm.getRawValue();

    this.recording.set(true);
    this.inventoryService
      .recordTransaction({ itemId: item.id, transactionType: value.transactionType, quantity: value.quantity, remark: value.remark || null })
      .subscribe({
        next: (response) => {
          this.recording.set(false);
          if (response.isSuccess) {
            this.toast.success('Transaction recorded.');
            this.transactingItem.set(null);
            this.load();
          } else {
            this.toast.error(response.errorMessage ?? 'Unable to record this transaction.');
          }
        },
        error: () => {
          this.recording.set(false);
          this.toast.error('Unable to record this transaction right now.');
        },
      });
  }
}
