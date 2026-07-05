import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ReportCardDTO } from '../../../core/models/exam.model';
import { ClassWithSectionsDto, ExamTypeRequest } from '../../../core/models/setup.model';
import { StudentRosterItem } from '../../../core/models/student.model';
import { ExamService } from '../../../core/services/exam.service';
import { SessionContextService } from '../../../core/services/session-context.service';
import { SetupService } from '../../../core/services/setup.service';
import { StudentService } from '../../../core/services/student.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-report-card-lookup',
  standalone: true,
  imports: [EmptyStateComponent, MatButtonModule, MatFormFieldModule, MatProgressSpinnerModule, MatSelectModule, ReactiveFormsModule, SkeletonComponent],
  templateUrl: './report-card-lookup.component.html',
  styleUrl: './report-card-lookup.component.scss',
})
export class ReportCardLookupComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly studentService = inject(StudentService);
  private readonly examService = inject(ExamService);
  private readonly sessionContext = inject(SessionContextService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly loadingRoster = signal(false);
  readonly loadingReport = signal(false);

  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly examTypes = signal<ExamTypeRequest[]>([]);
  readonly roster = signal<StudentRosterItem[]>([]);
  readonly reportCard = signal<ReportCardDTO | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    classSectionId: [null as number | null, Validators.required],
    studentId: [null as number | null, Validators.required],
    examTypeId: [null as number | null, Validators.required],
  });

  constructor() {
    // Reloads the roster whenever the active session changes (e.g. an
    // Admin switches sessions from the topbar while this page is open) —
    // `loadRoster()` reads the session live rather than from a snapshot.
    effect(
      () => {
        this.sessionContext.activeSession();
        this.form.controls.studentId.setValue(null);
        this.reportCard.set(null);
        this.loadRoster();
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    forkJoin({
      classSections: this.setupService.getAllClassesWithSections(),
      examTypes: this.setupService.getAllExamType(),
      session: this.sessionContext.load(),
    }).subscribe({
      next: (result) => {
        this.classSections.set(result.classSections.data ?? []);
        this.examTypes.set((result.examTypes.data ?? []).filter((type) => type.isActive));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load report card lookups.');
      },
    });

    this.form.controls.classSectionId.valueChanges.subscribe(() => {
      this.form.controls.studentId.setValue(null);
      this.reportCard.set(null);
      this.loadRoster();
    });
    this.form.controls.studentId.valueChanges.subscribe(() => this.loadReportCard());
    this.form.controls.examTypeId.valueChanges.subscribe(() => this.loadReportCard());
  }

  private loadRoster(): void {
    const classSectionId = this.form.controls.classSectionId.value;
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

  private loadReportCard(): void {
    const studentId = this.form.controls.studentId.value;
    const examTypeId = this.form.controls.examTypeId.value;
    this.reportCard.set(null);
    if (!studentId || !examTypeId) {
      return;
    }
    this.loadingReport.set(true);
    this.examService.getReportCard(studentId, examTypeId).subscribe({
      next: (response) => {
        this.reportCard.set(response.data ?? null);
        this.loadingReport.set(false);
        if (response.isSuccess && !response.data) {
          this.toast.error(response.errorMessage ?? 'No marks recorded for this exam yet.');
        }
      },
      error: () => {
        this.loadingReport.set(false);
        this.toast.error('Unable to load the report card.');
      },
    });
  }

  print(): void {
    const studentId = this.form.controls.studentId.value;
    const examTypeId = this.form.controls.examTypeId.value;
    if (!studentId || !examTypeId) {
      return;
    }
    this.router.navigate(['/exam/report-card'], { queryParams: { studentId, examTypeId } });
  }
}
