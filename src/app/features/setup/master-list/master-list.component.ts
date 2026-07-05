import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { MasterApiResponseDTO } from '../../../core/models/shared.model';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { MasterItemDialogComponent, MasterItemDialogResult } from '../master-item-dialog/master-item-dialog.component';

/** Reusable list + add/edit/deactivate UI for the plain `{id, name, isActive}`
 * master-data shape — Department, Designation, Subject, Bus Route all use
 * this directly rather than each getting a bespoke component. Deactivate is
 * one-way (no backend "reactivate" endpoint exists), so inactive rows show a
 * status chip only, no action. */
@Component({
  selector: 'app-master-list',
  standalone: true,
  imports: [EmptyStateComponent, MatButtonModule, MatIconModule, MatTableModule, SkeletonComponent],
  templateUrl: './master-list.component.html',
  styleUrl: './master-list.component.scss',
})
export class MasterListComponent {
  @Input({ required: true }) label = 'Item';
  @Input() items: MasterApiResponseDTO[] = [];
  @Input() loading = false;

  @Output() readonly save = new EventEmitter<MasterItemDialogResult>();
  @Output() readonly deactivate = new EventEmitter<MasterApiResponseDTO>();

  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly displayedColumns = ['name', 'status', 'actions'];

  openCreate(): void {
    this.openDialog(null);
  }

  openEdit(item: MasterApiResponseDTO): void {
    this.openDialog(item);
  }

  confirmDeactivate(item: MasterApiResponseDTO): void {
    this.confirmDialog
      .confirm({
        title: `Deactivate ${this.label}`,
        message: `Deactivate "${item.name}"? It will no longer be selectable in new records.`,
        confirmLabel: 'Deactivate',
        danger: true,
      })
      .subscribe((result) => {
        if (result) {
          this.deactivate.emit(item);
        }
      });
  }

  private openDialog(item: MasterApiResponseDTO | null): void {
    this.dialog
      .open(MasterItemDialogComponent, { data: { label: this.label, item }, width: '360px' })
      .afterClosed()
      .subscribe((result: MasterItemDialogResult | undefined) => {
        if (result) {
          this.save.emit(result);
        }
      });
  }
}
