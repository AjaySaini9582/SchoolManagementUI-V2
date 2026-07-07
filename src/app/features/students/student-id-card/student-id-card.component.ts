import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { MASTER_KEY, MasterKeyDataValue } from '../../../core/models/master.model';
import { Student } from '../../../core/models/student.model';
import { MasterService } from '../../../core/services/master.service';
import { SchoolProfileContextService } from '../../../core/services/school-profile-context.service';
import { SessionContextService } from '../../../core/services/session-context.service';
import { StudentService } from '../../../core/services/student.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-student-id-card',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './student-id-card.component.html',
  styleUrl: './student-id-card.component.scss',
})
export class StudentIdCardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentService = inject(StudentService);
  private readonly masterService = inject(MasterService);
  private readonly toast = inject(ToastService);

  private readonly schoolProfileContext = inject(SchoolProfileContextService);
  private readonly sessionContext = inject(SessionContextService);

  readonly schoolProfile = this.schoolProfileContext.schoolProfile;
  readonly logoUrl = this.schoolProfileContext.logoUrl;
  readonly activeSession = this.sessionContext.activeSession;

  readonly loading = signal(true);
  readonly student = signal<Student | null>(null);
  readonly bloodGroups = signal<MasterKeyDataValue[]>([]);

  ngOnInit(): void {
    const studentId = Number(this.route.snapshot.queryParamMap.get('studentId') ?? 0);
    if (!studentId) {
      this.loading.set(false);
      return;
    }

    forkJoin({
      student: this.studentService.getStudentDetail(studentId),
      bloodGroups: this.masterService.getMasterKeyData([MASTER_KEY.BloodGroup]),
      schoolProfile: this.schoolProfileContext.load(),
      session: this.sessionContext.load(),
    }).subscribe({
      next: (result) => {
        this.student.set(result.student.data ?? null);
        this.bloodGroups.set(result.bloodGroups.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load this student.');
      },
    });
  }

  photoUrl(): string | null {
    const student = this.student();
    return student?.photo ? `${environment.apiBaseUrl}/UploadFiles/Student/${student.id}/${student.photo}` : null;
  }

  bloodGroupText(): string {
    const bloodGroupId = this.student()?.studentAdmissionDetail?.bloodGroupId;
    return this.bloodGroups().find((option) => option.id === bloodGroupId)?.text ?? '—';
  }

  print(): void {
    window.print();
  }

  back(): void {
    this.router.navigateByUrl('/students');
  }
}
