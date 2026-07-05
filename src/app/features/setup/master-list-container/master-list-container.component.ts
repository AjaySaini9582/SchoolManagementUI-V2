import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseResponse } from '../../../core/models/base-response.model';
import { MasterApiResponseDTO } from '../../../core/models/shared.model';
import { ToastService } from '../../../shared/toast/toast.service';
import { MasterItemDialogResult } from '../master-item-dialog/master-item-dialog.component';
import { MasterListComponent } from '../master-list/master-list.component';

/** Wires `MasterListComponent` (dumb list + dialogs) up to whichever
 * service calls a given master-data tab needs — avoids repeating the same
 * load/save/deactivate boilerplate for Department/Designation/Subject/Bus
 * Route, which all share the plain `{id, name, isActive}` shape. */
@Component({
  selector: 'app-master-list-container',
  standalone: true,
  imports: [MasterListComponent],
  template: `
    <app-master-list
      [label]="label"
      [items]="items()"
      [loading]="loading()"
      (save)="onSave($event)"
      (deactivate)="onDeactivate($event)"
    />
  `,
})
export class MasterListContainerComponent<T extends MasterApiResponseDTO> implements OnInit {
  @Input({ required: true }) label = 'Item';
  @Input({ required: true }) fetchList!: () => Observable<BaseResponse<T[]>>;
  @Input({ required: true }) saveItem!: (item: MasterItemDialogResult) => Observable<BaseResponse<boolean>>;
  @Input() deactivateItem?: (id: number) => Observable<BaseResponse<boolean>>;

  private readonly toast = inject(ToastService);

  readonly items = signal<T[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.fetchList().subscribe({
      next: (response) => {
        this.items.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error(`Unable to load ${this.label.toLowerCase()}s.`);
      },
    });
  }

  onSave(result: MasterItemDialogResult): void {
    this.saveItem(result).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success(`${this.label} saved.`);
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? `Unable to save ${this.label.toLowerCase()}.`);
        }
      },
      error: () => this.toast.error(`Unable to save ${this.label.toLowerCase()} right now.`),
    });
  }

  onDeactivate(item: MasterApiResponseDTO): void {
    if (!this.deactivateItem) {
      return;
    }
    this.deactivateItem(item.id).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success(`${this.label} deactivated.`);
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? `Unable to deactivate ${this.label.toLowerCase()}.`);
        }
      },
      error: () => this.toast.error(`Unable to deactivate ${this.label.toLowerCase()} right now.`),
    });
  }
}
