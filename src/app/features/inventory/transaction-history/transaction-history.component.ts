import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';

import {
  INVENTORY_TRANSACTION_TYPE,
  INVENTORY_TRANSACTION_TYPE_LABEL,
  InventoryItemListItem,
  InventoryTransactionListItem,
} from '../../../core/models/inventory.model';
import { InventoryService } from '../../../core/services/inventory.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent, MatFormFieldModule, MatSelectModule, MatTableModule, SkeletonComponent],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.scss',
})
export class TransactionHistoryComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly toast = inject(ToastService);

  readonly INVENTORY_TRANSACTION_TYPE = INVENTORY_TRANSACTION_TYPE;
  readonly INVENTORY_TRANSACTION_TYPE_LABEL = INVENTORY_TRANSACTION_TYPE_LABEL;

  readonly loadingLookups = signal(true);
  readonly loadingHistory = signal(false);
  readonly items = signal<InventoryItemListItem[]>([]);
  readonly itemFilter = signal<number | null>(null);
  readonly history = signal<InventoryTransactionListItem[]>([]);
  readonly displayedColumns = ['item', 'type', 'quantity', 'remark', 'date'];

  ngOnInit(): void {
    forkJoin({ items: this.inventoryService.getItemList() }).subscribe({
      next: (result) => {
        this.items.set(result.items.data ?? []);
        this.loadingLookups.set(false);
        this.load();
      },
      error: () => {
        this.loadingLookups.set(false);
        this.toast.error('Unable to load inventory items.');
      },
    });
  }

  onFilterChange(itemId: number | null): void {
    this.itemFilter.set(itemId);
    this.load();
  }

  private load(): void {
    this.loadingHistory.set(true);
    this.inventoryService.getTransactionHistory(this.itemFilter()).subscribe({
      next: (response) => {
        this.history.set(response.data ?? []);
        this.loadingHistory.set(false);
      },
      error: () => {
        this.loadingHistory.set(false);
        this.toast.error('Unable to load transaction history.');
      },
    });
  }
}
