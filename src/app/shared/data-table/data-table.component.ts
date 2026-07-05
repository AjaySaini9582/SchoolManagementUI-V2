import { BreakpointObserver } from '@angular/cdk/layout';
import { NgTemplateOutlet } from '@angular/common';
import { DestroyRef, Component, ContentChildren, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Observable, Subject, debounceTime, distinctUntilChanged, map } from 'rxjs';

import { DataTableRequest, DataTableResponse } from '../../core/models/data-table.model';
import { BELOW_MD_BREAKPOINT } from '../breakpoints';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { ToastService } from '../toast/toast.service';
import { downloadCsv, toCsv } from '../utils/csv-export.util';
import { DataTableCellDirective } from './data-table-cell.directive';
import { DataTableColumn } from './data-table.model';

/** Drives Angular Material's table/paginator/sort off the backend's
 * `DataTableRequest`/`DataTableResponse` contract (server-side paging, sort,
 * search) — every `Get*List`/`Get*Grid` endpoint shares this exact shape.
 * Below the `md` breakpoint, rows render as stacked label/value cards
 * instead of a horizontally-scrolling table. */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    EmptyStateComponent,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSortModule,
    MatTableModule,
    NgTemplateOutlet,
    SkeletonComponent,
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T, TFilter = unknown> implements OnInit, OnChanges {
  @Input({ required: true }) columns: DataTableColumn<T>[] = [];
  @Input({ required: true }) fetchPage!: (request: DataTableRequest<TFilter>) => Observable<DataTableResponse<T>>;
  @Input() filter: TFilter = {} as TFilter;
  @Input() pageSizeOptions: number[] = [10, 25, 50];
  @Input() searchable = true;
  @Input() trackByKey = 'id';
  @Input() emptyIcon = 'inbox';
  @Input() emptyTitle = 'No records found';
  @Input() emptyDescription = '';
  @Input() exportable = true;
  @Input() exportFilename = 'export';

  @Output() readonly rowClick = new EventEmitter<T>();

  @ContentChildren(DataTableCellDirective) cellTemplates!: QueryList<DataTableCellDirective<T>>;

  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly searchInput$ = new Subject<string>();

  readonly isMobile = toSignal(
    this.breakpointObserver.observe(BELOW_MD_BREAKPOINT).pipe(map((result) => result.matches)),
    { initialValue: this.breakpointObserver.isMatched(BELOW_MD_BREAKPOINT) },
  );

  readonly rows = signal<T[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(false);
  readonly hasLoadedOnce = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(this.pageSizeOptions[0]);
  readonly searchValue = signal('');
  readonly exporting = signal(false);
  private sortColumn: string | null = null;
  private sortDirection: 'asc' | 'desc' | '' = '';

  get displayedColumns(): string[] {
    return this.columns.map((column) => column.key);
  }

  get exportableColumns(): DataTableColumn<T>[] {
    return this.columns.filter((column) => column.exportable !== false);
  }

  get skeletonRowIndexes(): number[] {
    return Array.from({ length: Math.min(this.pageSize(), 5) }, (_, i) => i);
  }

  ngOnInit(): void {
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.searchValue.set(value);
        this.pageIndex.set(0);
        this.load();
      });
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filter'] && !changes['filter'].firstChange) {
      this.pageIndex.set(0);
      this.load();
    }
  }

  cellTemplateFor(column: string): DataTableCellDirective<T> | undefined {
    return this.cellTemplates?.find((template) => template.column === column);
  }

  cellText(column: DataTableColumn<T>, row: T): string {
    return column.cell ? column.cell(row) : String((row as Record<string, unknown>)[column.key] ?? '');
  }

  trackRow(row: T): unknown {
    return (row as Record<string, unknown>)[this.trackByKey] ?? row;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onSortChange(sort: Sort): void {
    this.sortColumn = sort.direction ? sort.active : null;
    this.sortDirection = sort.direction;
    this.pageIndex.set(0);
    this.load();
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  reload(): void {
    this.load();
  }

  exportCurrentPage(): void {
    const csv = toCsv(this.toCsvRows(this.rows()), this.exportableColumns);
    downloadCsv(csv, this.exportFilename);
  }

  exportAllResults(): void {
    if (this.totalCount() === 0) {
      this.toast.info('Nothing to export.');
      return;
    }
    this.exporting.set(true);
    this.fetchPage(this.buildRequest({ start: 0, length: this.totalCount() })).subscribe({
      next: (response) => {
        this.exporting.set(false);
        const csv = toCsv(this.toCsvRows(response.data ?? []), this.exportableColumns);
        downloadCsv(csv, this.exportFilename);
      },
      error: () => {
        this.exporting.set(false);
        this.toast.error('Unable to export data.');
      },
    });
  }

  private toCsvRows(rows: T[]): Record<string, unknown>[] {
    return rows.map((row) => {
      const record: Record<string, unknown> = {};
      for (const column of this.exportableColumns) {
        record[column.key] = this.cellText(column, row);
      }
      return record;
    });
  }

  private buildRequest(page: { start: number; length: number }): DataTableRequest<TFilter> {
    return {
      dataTableParameters: {
        draw: 1,
        start: page.start,
        length: page.length,
        searchValue: this.searchValue() || null,
        sortColumn: this.sortColumn,
        sortDirection: this.sortDirection || null,
      },
      requestModal: this.filter,
    };
  }

  private load(): void {
    this.loading.set(true);
    this.fetchPage(this.buildRequest({ start: this.pageIndex() * this.pageSize(), length: this.pageSize() })).subscribe({
      next: (response) => {
        this.rows.set(response.data ?? []);
        this.totalCount.set(response.recordsTotal ?? 0);
        this.loading.set(false);
        this.hasLoadedOnce.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.hasLoadedOnce.set(true);
        this.toast.error('Unable to load data.');
      },
    });
  }
}
