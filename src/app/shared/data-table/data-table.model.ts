export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Plain-text accessor, used unless a `[appDataTableCell]="key"` template is projected for this column. */
  cell?: (row: T) => string;
  sortable?: boolean;
  width?: string;
  /** Set false for action/button columns that have no meaningful text value in a CSV export. */
  exportable?: boolean;
}

export interface DataTableCellContext<T> {
  $implicit: T;
  row: T;
}
