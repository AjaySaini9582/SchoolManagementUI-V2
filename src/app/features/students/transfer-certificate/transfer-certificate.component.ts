import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Student } from '../../../core/models/student.model';
import { TransferCertificate } from '../../../core/models/transfer-certificate.model';
import { AttendanceService } from '../../../core/services/attendance.service';
import { SessionContextService } from '../../../core/services/session-context.service';
import { StudentService } from '../../../core/services/student.service';
import { TransferCertificateService } from '../../../core/services/transfer-certificate.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-transfer-certificate',
  standalone: true,
  imports: [
    FieldErrorComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './transfer-certificate.component.html',
  styleUrl: './transfer-certificate.component.scss',
})
export class TransferCertificateComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentService = inject(StudentService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly transferCertificateService = inject(TransferCertificateService);
  private readonly sessionContext = inject(SessionContextService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  private readonly studentId = Number(this.route.snapshot.queryParamMap.get('studentId') ?? 0);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly student = signal<Student | null>(null);
  readonly isAlreadyIssued = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    id: [0],
    tcNumber: ['', Validators.required],
    tcDate: ['', Validators.required],
    nameOfPupil: ['', Validators.required],
    nameOfFatherMotherGuardian: [''],
    nationality: ['Indian'],
    category: [''],
    dateOfFirstAdmission: [''],
    admissionNumber: [''],
    dateOfBirth: [''],
    classLastStudied: [''],
    durationOfStay: [''],
    lastExamResult: [''],
    failedInSameClass: [false],
    subjectsStudied: [''],
    qualifiedForPromotion: [true],
    promotedToClass: [''],
    feesPaidUpToMonth: [''],
    feeConcessionAvailed: [''],
    totalWorkingDays: [null as number | null],
    totalPresentDays: [null as number | null],
    extraCurricularActivities: [''],
    generalConduct: ['Good'],
    dateOfLeaving: [new Date().toISOString().substring(0, 10), Validators.required],
    reasonForLeaving: ['', Validators.required],
    remarks: [''],
  });

  ngOnInit(): void {
    if (!this.studentId) {
      this.loading.set(false);
      return;
    }

    forkJoin({
      student: this.studentService.getStudentDetail(this.studentId),
      existing: this.transferCertificateService.getTransferCertificate(this.studentId),
      session: this.sessionContext.load(),
    }).subscribe({
      next: (result) => {
        const student = result.student.data;
        this.student.set(student);

        if (result.existing.isSuccess && result.existing.data) {
          this.isAlreadyIssued.set(true);
          this.patchFromCertificate(result.existing.data);
          this.loading.set(false);
        } else if (student) {
          this.prefillFromStudent(student);
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load this student.');
      },
    });
  }

  private prefillFromStudent(student: Student): void {
    const activeSessionId = this.sessionContext.activeSession()?.id ?? null;
    this.attendanceService.getStudentAttendancePercentage(this.studentId, activeSessionId).subscribe({
      next: (response) => {
        const summary = response.data;
        this.form.patchValue({
          nameOfPupil: student.name,
          nameOfFatherMotherGuardian: student.fatherName ?? '',
          dateOfFirstAdmission: student.admissionDate ? student.admissionDate.substring(0, 10) : '',
          admissionNumber: student.admissionNumber ?? '',
          dateOfBirth: student.dob ? student.dob.substring(0, 10) : '',
          classLastStudied: student.className && student.sectionName ? `${student.className} - ${student.sectionName}` : '',
          totalWorkingDays: summary?.totalMarkedDays ?? null,
          totalPresentDays: summary?.presentCount ?? null,
        });
        this.loading.set(false);
      },
      error: () => {
        // Attendance summary is a nice-to-have prefill — don't block the form on it.
        this.form.patchValue({
          nameOfPupil: student.name,
          nameOfFatherMotherGuardian: student.fatherName ?? '',
          dateOfFirstAdmission: student.admissionDate ? student.admissionDate.substring(0, 10) : '',
          admissionNumber: student.admissionNumber ?? '',
          dateOfBirth: student.dob ? student.dob.substring(0, 10) : '',
          classLastStudied: student.className && student.sectionName ? `${student.className} - ${student.sectionName}` : '',
        });
        this.loading.set(false);
      },
    });
  }

  private patchFromCertificate(certificate: TransferCertificate): void {
    this.form.reset({
      id: certificate.id,
      tcNumber: certificate.tcNumber,
      tcDate: certificate.tcDate.substring(0, 10),
      nameOfPupil: certificate.nameOfPupil,
      nameOfFatherMotherGuardian: certificate.nameOfFatherMotherGuardian ?? '',
      nationality: certificate.nationality ?? 'Indian',
      category: certificate.category ?? '',
      dateOfFirstAdmission: certificate.dateOfFirstAdmission ? certificate.dateOfFirstAdmission.substring(0, 10) : '',
      admissionNumber: certificate.admissionNumber ?? '',
      dateOfBirth: certificate.dateOfBirth ? certificate.dateOfBirth.substring(0, 10) : '',
      classLastStudied: certificate.classLastStudied ?? '',
      durationOfStay: certificate.durationOfStay ?? '',
      lastExamResult: certificate.lastExamResult ?? '',
      failedInSameClass: certificate.failedInSameClass,
      subjectsStudied: certificate.subjectsStudied ?? '',
      qualifiedForPromotion: certificate.qualifiedForPromotion,
      promotedToClass: certificate.promotedToClass ?? '',
      feesPaidUpToMonth: certificate.feesPaidUpToMonth ?? '',
      feeConcessionAvailed: certificate.feeConcessionAvailed ?? '',
      totalWorkingDays: certificate.totalWorkingDays,
      totalPresentDays: certificate.totalPresentDays,
      extraCurricularActivities: certificate.extraCurricularActivities ?? '',
      generalConduct: certificate.generalConduct ?? 'Good',
      dateOfLeaving: certificate.dateOfLeaving.substring(0, 10),
      reasonForLeaving: certificate.reasonForLeaving ?? '',
      remarks: certificate.remarks ?? '',
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Fill in the required fields before generating.');
      return;
    }

    if (this.isAlreadyIssued()) {
      this.submit();
      return;
    }

    this.confirmDialog
      .confirm({
        title: 'Issue Transfer Certificate',
        message: `Issuing a Transfer Certificate for ${this.student()?.name} will mark this student as inactive/left. Continue?`,
        confirmLabel: 'Issue TC',
        danger: true,
      })
      .subscribe((result) => {
        if (result) {
          this.submit();
        }
      });
  }

  private submit(): void {
    const value = this.form.getRawValue();
    const certificate: TransferCertificate = {
      id: value.id,
      studentId: this.studentId,
      tcNumber: value.tcNumber,
      tcDate: value.tcDate,
      nameOfPupil: value.nameOfPupil,
      nameOfFatherMotherGuardian: value.nameOfFatherMotherGuardian || null,
      nationality: value.nationality || null,
      category: value.category || null,
      dateOfFirstAdmission: value.dateOfFirstAdmission || null,
      admissionNumber: value.admissionNumber || null,
      dateOfBirth: value.dateOfBirth || null,
      classLastStudied: value.classLastStudied || null,
      durationOfStay: value.durationOfStay || null,
      lastExamResult: value.lastExamResult || null,
      failedInSameClass: value.failedInSameClass,
      subjectsStudied: value.subjectsStudied || null,
      qualifiedForPromotion: value.qualifiedForPromotion,
      promotedToClass: value.promotedToClass || null,
      feesPaidUpToMonth: value.feesPaidUpToMonth || null,
      feeConcessionAvailed: value.feeConcessionAvailed || null,
      totalWorkingDays: value.totalWorkingDays,
      totalPresentDays: value.totalPresentDays,
      extraCurricularActivities: value.extraCurricularActivities || null,
      generalConduct: value.generalConduct || null,
      dateOfLeaving: value.dateOfLeaving,
      reasonForLeaving: value.reasonForLeaving || null,
      remarks: value.remarks || null,
    };

    this.saving.set(true);
    this.transferCertificateService.createOrUpdateTransferCertificate(certificate).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) {
          this.toast.success('Transfer certificate saved.');
          this.router.navigateByUrl(`/students/transfer-certificate/print?studentId=${this.studentId}`);
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to save the transfer certificate.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to save the transfer certificate right now.');
      },
    });
  }

  viewCertificate(): void {
    this.router.navigateByUrl(`/students/transfer-certificate/print?studentId=${this.studentId}`);
  }

  cancel(): void {
    this.router.navigateByUrl('/students');
  }
}
