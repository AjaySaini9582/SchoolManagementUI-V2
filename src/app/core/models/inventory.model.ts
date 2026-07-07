export const INVENTORY_TRANSACTION_TYPE = {
  In: 1,
  Out: 2,
} as const;

export const INVENTORY_TRANSACTION_TYPE_LABEL: Partial<Record<number, string>> = {
  [INVENTORY_TRANSACTION_TYPE.In]: 'Stock In',
  [INVENTORY_TRANSACTION_TYPE.Out]: 'Stock Out',
};

export interface InventoryItem {
  id: number;
  name: string;
  category: string | null;
  unit: string | null;
  reorderLevel: number;
  isActive: boolean;
}

export interface InventoryItemListItem {
  id: number;
  name: string | null;
  category: string | null;
  unit: string | null;
  quantityInStock: number;
  reorderLevel: number;
  isBelowReorderLevel: boolean;
  isActive: boolean;
}

export interface RecordTransactionRequest {
  itemId: number;
  transactionType: number;
  quantity: number;
  remark: string | null;
}

export interface InventoryTransactionListItem {
  id: number;
  itemId: number;
  itemName: string | null;
  transactionType: number;
  quantity: number;
  remark: string | null;
  transactionDate: string;
}

export interface InventoryActionResult {
  isSuccess: boolean;
  errorMessage: string | null;
}
