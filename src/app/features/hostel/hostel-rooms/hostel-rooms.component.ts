import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { HostelRoom, HostelRoomListItem } from '../../../core/models/hostel.model';
import { HostelService } from '../../../core/services/hostel.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-hostel-rooms',
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
  templateUrl: './hostel-rooms.component.html',
  styleUrl: './hostel-rooms.component.scss',
})
export class HostelRoomsComponent implements OnInit {
  private readonly hostelService = inject(HostelService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly rooms = signal<HostelRoomListItem[]>([]);
  readonly displayedColumns = ['block', 'room', 'occupancy', 'actions'];

  readonly form = this.formBuilder.nonNullable.group({
    hostelBlock: ['', Validators.required],
    roomNumber: ['', Validators.required],
    capacity: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.hostelService.getRoomList().subscribe({
      next: (response) => {
        this.rooms.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load hostel rooms.');
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ hostelBlock: '', roomNumber: '', capacity: 1 });
    this.showForm.set(true);
  }

  openEdit(row: HostelRoomListItem): void {
    this.editingId.set(row.id);
    this.form.reset({ hostelBlock: row.hostelBlock ?? '', roomNumber: row.roomNumber ?? '', capacity: row.capacity });
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
    const room: HostelRoom = {
      id: this.editingId() ?? 0,
      hostelBlock: value.hostelBlock,
      roomNumber: value.roomNumber,
      capacity: value.capacity,
      isActive: true,
    };

    this.saving.set(true);
    this.hostelService.createOrUpdateRoom(room).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) {
          this.toast.success('Room saved.');
          this.showForm.set(false);
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to save this room.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to save this room right now.');
      },
    });
  }

  confirmDeactivate(row: HostelRoomListItem): void {
    this.confirmDialog
      .confirm({ title: 'Remove room', message: `Remove room ${row.roomNumber} (${row.hostelBlock})?`, confirmLabel: 'Remove', danger: true })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.hostelService.deactivateRoom(row.id).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Room removed.');
              this.load();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to remove this room.');
            }
          },
          error: () => this.toast.error('Unable to remove this room right now.'),
        });
      });
  }
}
