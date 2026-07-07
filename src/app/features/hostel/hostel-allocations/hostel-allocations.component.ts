import { DatePipe } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';

import {
  HOSTEL_ALLOCATION_STATUS,
  HOSTEL_ALLOCATION_STATUS_LABEL,
  HostelAllocationListItem,
  HostelRoomListItem,
} from '../../../core/models/hostel.model';
import { ClassWithSectionsDto } from '../../../core/models/setup.model';
import { StudentRosterItem } from '../../../core/models/student.model';
import { HostelService } from '../../../core/services/hostel.service';
import { SessionContextService } from '../../../core/services/session-context.service';
import { SetupService } from '../../../core/services/setup.service';
import { StudentService } from '../../../core/services/student.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-hostel-allocations',
  standalone: true,
  imports: [
    DatePipe,
    EmptyStateComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './hostel-allocations.component.html',
  styleUrl: './hostel-allocations.component.scss',
})
export class HostelAllocationsComponent implements OnInit {
  private readonly hostelService = inject(HostelService);
  private readonly setupService = inject(SetupService);
  private readonly studentService = inject(StudentService);
  private readonly sessionContext = inject(SessionContextService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly HOSTEL_ALLOCATION_STATUS = HOSTEL_ALLOCATION_STATUS;
  readonly HOSTEL_ALLOCATION_STATUS_LABEL = HOSTEL_ALLOCATION_STATUS_LABEL;

  readonly loadingLookups = signal(true);
  readonly loadingAllocations = signal(false);
  readonly loadingRoster = signal(false);
  readonly allocating = signal(false);
  readonly showForm = signal(false);

  readonly rooms = signal<HostelRoomListItem[]>([]);
  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly studentRoster = signal<StudentRosterItem[]>([]);

  readonly statusFilter = signal<number | null>(HOSTEL_ALLOCATION_STATUS.Allocated);
  readonly allocations = signal<HostelAllocationListItem[]>([]);
  readonly displayedColumns = ['room', 'student', 'allocationDate', 'status', 'actions'];

  readonly form = this.formBuilder.nonNullable.group({
    classSectionId: [null as number | null, Validators.required],
    studentId: [null as number | null, Validators.required],
    roomId: [null as number | null, Validators.required],
  });

  availableRooms(): HostelRoomListItem[] {
    return this.rooms().filter((room) => room.occupiedCount < room.capacity);
  }

  constructor() {
    // Mirrors Mark Attendance's/Library's session-reactive roster reload —
    // `loadStudentRoster` reads the active session live, not from a snapshot.
    effect(
      () => {
        this.sessionContext.activeSession();
        this.loadStudentRoster(this.form.controls.classSectionId.value);
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    forkJoin({
      rooms: this.hostelService.getRoomList(),
      classSections: this.setupService.getAllClassesWithSections(),
      session: this.sessionContext.load(),
    }).subscribe({
      next: (result) => {
        this.rooms.set(result.rooms.data ?? []);
        this.classSections.set(result.classSections.data ?? []);
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
        this.toast.error('Unable to load hostel lookups.');
      },
    });

    this.form.controls.classSectionId.valueChanges.subscribe((classSectionId) => {
      this.form.patchValue({ studentId: null });
      this.loadStudentRoster(classSectionId);
    });

    this.load();
  }

  private loadStudentRoster(classSectionId: number | null): void {
    this.studentRoster.set([]);
    const activeSessionId = this.sessionContext.activeSession()?.id;
    if (!classSectionId || !activeSessionId) {
      return;
    }
    this.loadingRoster.set(true);
    this.studentService.getStudentRoster(activeSessionId, classSectionId).subscribe({
      next: (response) => {
        this.studentRoster.set(response.data ?? []);
        this.loadingRoster.set(false);
      },
      error: () => {
        this.loadingRoster.set(false);
        this.toast.error('Unable to load the student roster.');
      },
    });
  }

  onFilterChange(status: number | null): void {
    this.statusFilter.set(status);
    this.load();
  }

  private load(): void {
    this.loadingAllocations.set(true);
    this.hostelService.getAllAllocations(this.statusFilter()).subscribe({
      next: (response) => {
        this.allocations.set(response.data ?? []);
        this.loadingAllocations.set(false);
      },
      error: () => {
        this.loadingAllocations.set(false);
        this.toast.error('Unable to load hostel allocations.');
      },
    });
  }

  openAllocateForm(): void {
    this.form.reset({ classSectionId: null, studentId: null, roomId: null });
    this.studentRoster.set([]);
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
  }

  allocate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();

    this.allocating.set(true);
    this.hostelService.allocateRoom({ roomId: value.roomId as number, studentId: value.studentId as number }).subscribe({
      next: (response) => {
        this.allocating.set(false);
        if (response.isSuccess) {
          this.toast.success('Room allocated.');
          this.showForm.set(false);
          this.load();
          this.hostelService.getRoomList().subscribe((rooms) => this.rooms.set(rooms.data ?? []));
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to allocate this room.');
        }
      },
      error: () => {
        this.allocating.set(false);
        this.toast.error('Unable to allocate this room right now.');
      },
    });
  }

  confirmVacate(row: HostelAllocationListItem): void {
    this.confirmDialog
      .confirm({ title: 'Vacate room', message: `Vacate room ${row.roomNumber} for ${row.studentName}?`, confirmLabel: 'Vacate' })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.hostelService.vacateRoom(row.id).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Room vacated.');
              this.load();
              this.hostelService.getRoomList().subscribe((rooms) => this.rooms.set(rooms.data ?? []));
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to vacate this room.');
            }
          },
          error: () => this.toast.error('Unable to vacate this room right now.'),
        });
      });
  }
}
