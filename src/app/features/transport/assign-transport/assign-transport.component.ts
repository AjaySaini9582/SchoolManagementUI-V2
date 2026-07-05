import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';

import { CreateBusStoppageDTO, ClassWithSectionsDto } from '../../../core/models/setup.model';
import { MasterApiResponseDTO } from '../../../core/models/shared.model';
import { Student, StudentRosterItem } from '../../../core/models/student.model';
import { SessionContextService } from '../../../core/services/session-context.service';
import { SetupService } from '../../../core/services/setup.service';
import { StudentService } from '../../../core/services/student.service';
import { TransportService } from '../../../core/services/transport.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-assign-transport',
  standalone: true,
  imports: [EmptyStateComponent, MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule, ReactiveFormsModule, SkeletonComponent],
  templateUrl: './assign-transport.component.html',
  styleUrl: './assign-transport.component.scss',
})
export class AssignTransportComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly studentService = inject(StudentService);
  private readonly transportService = inject(TransportService);
  private readonly sessionContext = inject(SessionContextService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly loadingRoster = signal(false);
  readonly loadingStudent = signal(false);
  readonly saving = signal(false);

  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly busRoutes = signal<MasterApiResponseDTO[]>([]);
  readonly busStoppages = signal<CreateBusStoppageDTO[]>([]);
  readonly roster = signal<StudentRosterItem[]>([]);
  readonly student = signal<Student | null>(null);

  readonly pickerForm = this.formBuilder.nonNullable.group({
    classSectionId: [null as number | null, Validators.required],
    studentId: [null as number | null, Validators.required],
  });

  readonly assignForm = this.formBuilder.nonNullable.group({
    busRouteId: [null as number | null, Validators.required],
    busStoppageId: [null as number | null, Validators.required],
  });

  constructor() {
    // Reloads the roster whenever the active session changes (e.g. an
    // Admin switches sessions from the topbar while this page is open) —
    // `loadRoster()` reads the session live rather than from a snapshot.
    effect(
      () => {
        this.sessionContext.activeSession();
        this.pickerForm.controls.studentId.setValue(null);
        this.student.set(null);
        this.loadRoster();
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    forkJoin({
      classSections: this.setupService.getAllClassesWithSections(),
      busRoutes: this.setupService.getAllBusRoutes(),
      busStoppages: this.setupService.getAllBusStoppage(),
      session: this.sessionContext.load(),
    }).subscribe({
      next: (result) => {
        this.classSections.set(result.classSections.data ?? []);
        this.busRoutes.set((result.busRoutes.data ?? []).filter((route) => route.isActive));
        this.busStoppages.set((result.busStoppages.data ?? []).filter((stoppage) => stoppage.isActive));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load transport lookups.');
      },
    });

    this.pickerForm.controls.classSectionId.valueChanges.subscribe(() => {
      this.pickerForm.controls.studentId.setValue(null);
      this.student.set(null);
      this.loadRoster();
    });
    this.pickerForm.controls.studentId.valueChanges.subscribe(() => this.loadStudent());
    this.assignForm.controls.busRouteId.valueChanges.subscribe(() => this.assignForm.controls.busStoppageId.setValue(null));
  }

  stoppagesForSelectedRoute(): CreateBusStoppageDTO[] {
    const busRouteId = this.assignForm.controls.busRouteId.value;
    return this.busStoppages().filter((stoppage) => stoppage.busRoutId === busRouteId);
  }

  currentStoppage(): CreateBusStoppageDTO | null {
    const student = this.student();
    if (!student?.studentAdmissionDetail.isBus || !student.studentAdmissionDetail.busStoppageId) {
      return null;
    }
    return this.busStoppages().find((stoppage) => stoppage.id === student.studentAdmissionDetail.busStoppageId) ?? null;
  }

  currentRouteName(stoppage: CreateBusStoppageDTO): string {
    return this.busRoutes().find((route) => route.id === stoppage.busRoutId)?.name ?? '—';
  }

  private loadRoster(): void {
    const classSectionId = this.pickerForm.controls.classSectionId.value;
    const activeSessionId = this.sessionContext.activeSession()?.id ?? null;
    this.roster.set([]);
    if (!classSectionId || !activeSessionId) {
      return;
    }
    this.loadingRoster.set(true);
    this.studentService.getStudentRoster(activeSessionId, classSectionId).subscribe({
      next: (response) => {
        this.roster.set(response.data ?? []);
        this.loadingRoster.set(false);
      },
      error: () => {
        this.loadingRoster.set(false);
        this.toast.error('Unable to load the class roster.');
      },
    });
  }

  private loadStudent(): void {
    const studentId = this.pickerForm.controls.studentId.value;
    this.student.set(null);
    this.assignForm.reset({ busRouteId: null, busStoppageId: null });
    if (!studentId) {
      return;
    }
    this.loadingStudent.set(true);
    this.studentService.getStudentDetail(studentId).subscribe({
      next: (response) => {
        this.student.set(response.data ?? null);
        this.loadingStudent.set(false);
      },
      error: () => {
        this.loadingStudent.set(false);
        this.toast.error('Unable to load this student’s details.');
      },
    });
  }

  assign(): void {
    const studentId = this.pickerForm.controls.studentId.value;
    if (!studentId || this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      this.toast.error('Pick a route and stoppage before assigning.');
      return;
    }

    const busStoppageId = this.assignForm.controls.busStoppageId.value as number;
    this.saving.set(true);
    this.transportService.assignStudentTransport({ studentId, busStoppageId }).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) {
          this.toast.success('Transport assigned.');
          this.loadStudent();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to assign transport.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to assign transport right now.');
      },
    });
  }

  remove(): void {
    const studentId = this.pickerForm.controls.studentId.value;
    if (!studentId) {
      return;
    }
    this.confirmDialog
      .confirm({
        title: 'Remove transport',
        message: `Remove this student's bus transport assignment?`,
        confirmLabel: 'Remove',
        danger: true,
      })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.saving.set(true);
        this.transportService.removeStudentTransport(studentId).subscribe({
          next: (response) => {
            this.saving.set(false);
            if (response.isSuccess) {
              this.toast.success('Transport removed.');
              this.loadStudent();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to remove transport.');
            }
          },
          error: () => {
            this.saving.set(false);
            this.toast.error('Unable to remove transport right now.');
          },
        });
      });
  }
}
