import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Student } from '../../../core/models/student.model';
import { SchoolProfileContextService } from '../../../core/services/school-profile-context.service';
import { SessionContextService } from '../../../core/services/session-context.service';
import { StudentService } from '../../../core/services/student.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-bonafide-certificate',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './bonafide-certificate.component.html',
  styleUrl: './bonafide-certificate.component.scss',
})
export class BonafideCertificateComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentService = inject(StudentService);
  private readonly toast = inject(ToastService);

  private readonly schoolProfileContext = inject(SchoolProfileContextService);
  private readonly sessionContext = inject(SessionContextService);

  readonly schoolProfile = this.schoolProfileContext.schoolProfile;
  readonly letterheadUrl = this.schoolProfileContext.letterheadUrl;
  readonly logoUrl = this.schoolProfileContext.logoUrl;
  readonly activeSession = this.sessionContext.activeSession;
  readonly today = new Date();

  readonly loading = signal(true);
  readonly student = signal<Student | null>(null);

  ngOnInit(): void {
    const studentId = Number(this.route.snapshot.queryParamMap.get('studentId') ?? 0);
    if (!studentId) {
      this.loading.set(false);
      return;
    }

    forkJoin({
      student: this.studentService.getStudentDetail(studentId),
      schoolProfile: this.schoolProfileContext.load(),
      session: this.sessionContext.load(),
    }).subscribe({
      next: (result) => {
        this.student.set(result.student.data ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load this student.');
      },
    });
  }

  print(): void {
    window.print();
  }

  back(): void {
    this.router.navigateByUrl('/students');
  }
}
