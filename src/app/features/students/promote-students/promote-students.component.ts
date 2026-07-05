import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { ClassWithSectionsDto, SessionResponseDTO } from '../../../core/models/setup.model';
import { PromoteStudentsResult, StudentRosterItem } from '../../../core/models/student.model';
import { SetupService } from '../../../core/services/setup.service';
import { StudentService } from '../../../core/services/student.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-promote-students',
  standalone: true,
  imports: [
    EmptyStateComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './promote-students.component.html',
  styleUrl: './promote-students.component.scss',
})
export class PromoteStudentsComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly studentService = inject(StudentService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly sessions = signal<SessionResponseDTO[]>([]);
  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly roster = signal<StudentRosterItem[]>([]);
  readonly loadingRoster = signal(false);
  readonly promoting = signal(false);
  readonly selectedStudentIds = signal<Set<number>>(new Set());
  readonly result = signal<PromoteStudentsResult | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    sourceSessionId: [null as number | null, Validators.required],
    sourceClassSectionId: [null as number | null, Validators.required],
    targetSessionId: [null as number | null, Validators.required],
    targetClassSectionId: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.setupService.getAllCreateSession().subscribe((response) => this.sessions.set(response.data ?? []));
    this.setupService.getAllClassesWithSections().subscribe((response) => this.classSections.set(response.data ?? []));

    this.form.controls.sourceSessionId.valueChanges.subscribe(() => {
      this.result.set(null);
      this.loadRoster();
    });
    this.form.controls.sourceClassSectionId.valueChanges.subscribe(() => {
      this.result.set(null);
      this.loadRoster();
    });
  }

  get allSelected(): boolean {
    return this.roster().length > 0 && this.selectedStudentIds().size === this.roster().length;
  }

  get someSelected(): boolean {
    return this.selectedStudentIds().size > 0 && !this.allSelected;
  }

  toggleStudent(id: number): void {
    this.selectedStudentIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleAll(checked: boolean): void {
    this.selectedStudentIds.set(checked ? new Set(this.roster().map((student) => student.id)) : new Set());
  }

  promote(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.selectedStudentIds().size === 0) {
      this.toast.error('Select at least one student to promote.');
      return;
    }

    const value = this.form.getRawValue();
    this.promoting.set(true);
    this.result.set(null);
    this.studentService
      .promoteStudents({
        sourceSessionId: value.sourceSessionId as number,
        targetSessionId: value.targetSessionId as number,
        sourceClassSectionId: value.sourceClassSectionId as number,
        targetClassSectionId: value.targetClassSectionId as number,
        studentIds: Array.from(this.selectedStudentIds()),
      })
      .subscribe({
        next: (response) => {
          this.promoting.set(false);
          if (response.isSuccess) {
            this.toast.success(response.data?.message ?? 'Students promoted.');
            this.result.set(response.data);
            this.loadRoster();
          } else {
            this.toast.error(response.errorMessage ?? 'Unable to promote students.');
          }
        },
        error: () => {
          this.promoting.set(false);
          this.toast.error('Unable to promote students right now.');
        },
      });
  }

  private loadRoster(): void {
    const sessionId = this.form.controls.sourceSessionId.value;
    const classSectionId = this.form.controls.sourceClassSectionId.value;
    this.roster.set([]);
    this.selectedStudentIds.set(new Set());
    if (!sessionId || !classSectionId) {
      return;
    }
    this.loadingRoster.set(true);
    this.studentService.getStudentRoster(sessionId, classSectionId).subscribe({
      next: (response) => {
        const rows = response.data ?? [];
        this.roster.set(rows);
        this.selectedStudentIds.set(new Set(rows.map((student) => student.id)));
        this.loadingRoster.set(false);
      },
      error: () => {
        this.loadingRoster.set(false);
        this.toast.error('Unable to load the source roster.');
      },
    });
  }
}
