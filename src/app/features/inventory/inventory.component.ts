import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { InventoryItemsComponent } from './inventory-items/inventory-items.component';
import { TransactionHistoryComponent } from './transaction-history/transaction-history.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [InventoryItemsComponent, MatTabsModule, TransactionHistoryComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {}
