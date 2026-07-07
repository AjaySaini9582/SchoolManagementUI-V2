import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { StudentAttendanceSummaryDTO } from '../../../core/models/attendance.model';
import { MASTER_KEY, MasterKeyDataValue } from '../../../core/models/master.model';
import { ClassWithSectionsDto, HouseDTO, SessionResponseDTO } from '../../../core/models/setup.model';
import { MasterApiResponseDTO } from '../../../core/models/shared.model';
import { Student } from '../../../core/models/student.model';
import { DocumentOwnerType, DocumentStatusDTO } from '../../../core/models/document-verification.model';
import { AttendanceService } from '../../../core/services/attendance.service';
import { DocumentVerificationService } from '../../../core/services/document-verification.service';
import { MasterService } from '../../../core/services/master.service';
import { SetupService } from '../../../core/services/setup.service';
import { StudentService } from '../../../core/services/student.service';
import { CredentialsDialogComponent } from '../../../shared/credentials-dialog/credentials-dialog.component';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { FileUploadComponent } from '../../../shared/file-upload/file-upload.component';
import { ToastService } from '../../../shared/toast/toast.service';

interface DocumentRow {
  documentMasterId: number;
  documentName: string;
  file: File | null;
  status: DocumentStatusDTO | null;
}

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [
    FieldErrorComponent,
    FileUploadComponent,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatStepperModule,
    ReactiveFormsModule,
  ],
  templateUrl: './student-form.component.html',
  styleUrl: './student-form.component.scss',
})
export class StudentFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly studentService = inject(StudentService);
  private readonly setupService = inject(SetupService);
  private readonly masterService = inject(MasterService);
  private readonly documentVerificationService = inject(DocumentVerificationService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly studentId = Number(this.route.snapshot.paramMap.get('id') ?? 0);
  readonly isEdit = this.studentId > 0;

  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);

  // Lookups
  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly sessions = signal<SessionResponseDTO[]>([]);
  readonly genders = signal<MasterKeyDataValue[]>([]);
  readonly bloodGroups = signal<MasterKeyDataValue[]>([]);
  readonly mediums = signal<MasterKeyDataValue[]>([]);
  readonly admissionSchemes = signal<MasterKeyDataValue[]>([]);
  readonly admissionTypes = signal<MasterKeyDataValue[]>([]);
  readonly religions = signal<MasterKeyDataValue[]>([]);
  readonly casteCategories = signal<MasterApiResponseDTO[]>([]);
  readonly banks = signal<MasterApiResponseDTO[]>([]);
  readonly houses = signal<HouseDTO[]>([]);

  // Documents
  readonly documentRows = signal<DocumentRow[]>([]);

  readonly attendanceSummary = signal<StudentAttendanceSummaryDTO | null>(null);

  // Preserved as-is from the loaded record — Transport module (not this form) owns these.
  private existingIsBus: number | null = null;
  private existingBusStoppageId: number | null = null;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    fatherName: [''],
    motherName: [''],
    contactNumber: [''],
    dob: ['', Validators.required],
    genderId: [null as number | null, Validators.required],
    admissionNumber: [''],
    admissionDate: [''],
    ledgerNumber: [''],
    rollNumber: [null as number | null],
    srnNumber: [''],
    permananetEducationNumber: [''],
    familyId: [''],
    aaprId: [''],
    mediumId: [null as number | null],
    enrollmentSchoolName: [''],
    openingBalance: [''],

    studentClassSection: this.formBuilder.nonNullable.group({
      classSectionId: [null as number | null, Validators.required],
      sessionYearId: [null as number | null, Validators.required],
    }),

    studentAddress: this.formBuilder.nonNullable.group({
      presentAddress: [''],
      permanentAddress: [''],
    }),

    studentAdmissionDetail: this.formBuilder.nonNullable.group({
      schemeId: [null as number | null],
      admissionTypeId: [null as number | null],
      guardianName: [''],
      relation: [''],
      religionId: [null as number | null],
      casteCategoryId: [null as number | null],
      bloodGroupId: [null as number | null],
      birthPlace: [''],
      height_In_CM: [''],
      weight_In_KG: [''],
      colorVision: [''],
      previousClassId: [null as number | null],
      previousSchoolName: [''],
      tC_No: [''],
      tC_Date: [''],
      houseId: [null as number | null],
      isCaptainId: [0],
    }),

    studentDocumentDetail: this.formBuilder.nonNullable.group({
      studentAdharNumber: [''],
      studentBankAccountNumber: [''],
      studentBankId: [null as number | null],
      studentIFSCCode: [''],
      fatherAdharNumber: [''],
      parentAccountNumber: [''],
      parentBankId: [null as number | null],
      parentBankIFSCCode: [''],
      motherAdharNumber: [''],
      registrationNumber: [''],
      annualIncome: [null as number | null],
    }),

    studentFamilyDetail: this.formBuilder.nonNullable.group({
      fatherContactNumber: [''],
      fatherEmail: ['', Validators.email],
      fatherOccupation: [''],
      fatherQualification: [''],
      motherMobileNumber: [''],
      motherEmail: ['', Validators.email],
      motherOccupation: [''],
      motherQualification: [''],
      parentMobileNumber: [''],
      parentEmail: ['', Validators.email],
      parentOccupation: [''],
      parentQualification: [''],
      studentEmail: ['', Validators.email],
      isSMSFacility: [false],
      sMSMobileNumber: [''],
    }),
  });

  ngOnInit(): void {
    forkJoin({
      classSections: this.setupService.getAllClassesWithSections(),
      sessions: this.setupService.getAllCreateSession(),
      genderData: this.masterService.getMasterKeyData([
        MASTER_KEY.Gender,
        MASTER_KEY.BloodGroup,
        MASTER_KEY.MediumType,
        MASTER_KEY.AdmissionScheme,
        MASTER_KEY.AdmissionType,
        MASTER_KEY.Religion,
      ]),
      banks: this.masterService.getAllBankMaster(),
      houses: this.setupService.getAllHouse(),
      documentTypes: this.studentService.getAddDocumentMasterList(),
    }).subscribe({
      next: (result) => {
        this.classSections.set(result.classSections.data ?? []);
        this.sessions.set(result.sessions.data ?? []);
        this.banks.set(result.banks.data ?? []);
        this.houses.set(result.houses.data ?? []);

        const keyData = result.genderData.data ?? [];
        this.genders.set(keyData.filter((item) => item.keyId === MASTER_KEY.Gender));
        this.bloodGroups.set(keyData.filter((item) => item.keyId === MASTER_KEY.BloodGroup));
        this.mediums.set(keyData.filter((item) => item.keyId === MASTER_KEY.MediumType));
        this.admissionSchemes.set(keyData.filter((item) => item.keyId === MASTER_KEY.AdmissionScheme));
        this.admissionTypes.set(keyData.filter((item) => item.keyId === MASTER_KEY.AdmissionType));
        this.religions.set(keyData.filter((item) => item.keyId === MASTER_KEY.Religion));

        const documentTypes = result.documentTypes.data ?? [];
        this.documentRows.set(documentTypes.map((docType) => ({ documentMasterId: docType.id, documentName: docType.documentName ?? '', file: null, status: null })));

        if (this.isEdit) {
          this.loadStudent();
        }
      },
      error: () => this.toast.error('Unable to load form lookups.'),
    });

    this.form.controls.studentAdmissionDetail.controls.religionId.valueChanges.subscribe((religionId) => {
      this.form.controls.studentAdmissionDetail.controls.casteCategoryId.setValue(null);
      this.casteCategories.set([]);
      if (religionId) {
        this.masterService.getAllCasteCategoryById(religionId).subscribe((response) => this.casteCategories.set(response.data ?? []));
      }
    });
  }

  private loadStudent(): void {
    this.studentService.getStudentDetail(this.studentId).subscribe({
      next: (response) => {
        const student = response.data;
        if (!student) {
          this.toast.error('Student not found.');
          this.router.navigateByUrl('/students');
          return;
        }
        this.patchForm(student);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load student.');
      },
    });

    this.documentVerificationService.getDocumentsByOwner(DocumentOwnerType.Student, this.studentId).subscribe((response) => {
      const statuses = response.data ?? [];
      this.documentRows.update((rows) =>
        rows.map((row) => ({ ...row, status: statuses.find((status) => status.documentName === row.documentName) ?? null })),
      );
    });

    // Best-effort — no active session or no attendance history yet just means no badge shows.
    this.attendanceService.getStudentAttendancePercentage(this.studentId).subscribe({
      next: (response) => this.attendanceSummary.set(response.isSuccess ? (response.data ?? null) : null),
      error: () => this.attendanceSummary.set(null),
    });
  }

  private patchForm(student: Student): void {
    this.existingIsBus = student.studentAdmissionDetail.isBus;
    this.existingBusStoppageId = student.studentAdmissionDetail.busStoppageId;

    if (student.studentAdmissionDetail.religionId) {
      this.masterService
        .getAllCasteCategoryById(student.studentAdmissionDetail.religionId)
        .subscribe((response) => this.casteCategories.set(response.data ?? []));
    }

    this.form.patchValue({
      name: student.name,
      fatherName: student.fatherName ?? '',
      motherName: student.motherName ?? '',
      contactNumber: student.contactNumber ?? '',
      dob: student.dob ?? '',
      genderId: student.genderId,
      admissionNumber: student.admissionNumber ?? '',
      admissionDate: student.admissionDate ?? '',
      ledgerNumber: student.ledgerNumber ?? '',
      rollNumber: student.rollNumber,
      srnNumber: student.srnNumber ?? '',
      permananetEducationNumber: student.permananetEducationNumber ?? '',
      familyId: student.familyId ?? '',
      aaprId: student.aaprId ?? '',
      mediumId: student.mediumId,
      enrollmentSchoolName: student.enrollmentSchoolName ?? '',
      openingBalance: student.openingBalance ?? '',
      studentClassSection: student.studentClassSection,
      studentAddress: {
        presentAddress: student.studentAddress.presentAddress ?? '',
        permanentAddress: student.studentAddress.permanentAddress ?? '',
      },
      studentAdmissionDetail: {
        schemeId: student.studentAdmissionDetail.schemeId,
        admissionTypeId: student.studentAdmissionDetail.admissionTypeId,
        guardianName: student.studentAdmissionDetail.guardianName ?? '',
        relation: student.studentAdmissionDetail.relation ?? '',
        religionId: student.studentAdmissionDetail.religionId,
        casteCategoryId: student.studentAdmissionDetail.casteCategoryId,
        bloodGroupId: student.studentAdmissionDetail.bloodGroupId,
        birthPlace: student.studentAdmissionDetail.birthPlace ?? '',
        height_In_CM: student.studentAdmissionDetail.height_In_CM ?? '',
        weight_In_KG: student.studentAdmissionDetail.weight_In_KG ?? '',
        colorVision: student.studentAdmissionDetail.colorVision ?? '',
        previousClassId: student.studentAdmissionDetail.previousClassId,
        previousSchoolName: student.studentAdmissionDetail.previousSchoolName ?? '',
        tC_No: student.studentAdmissionDetail.tC_No ?? '',
        tC_Date: student.studentAdmissionDetail.tC_Date ?? '',
        houseId: student.studentAdmissionDetail.houseId,
        isCaptainId: student.studentAdmissionDetail.isCaptainId ?? 0,
      },
      studentDocumentDetail: {
        studentAdharNumber: student.studentDocumentDetail.studentAdharNumber ?? '',
        studentBankAccountNumber: student.studentDocumentDetail.studentBankAccountNumber ?? '',
        studentBankId: student.studentDocumentDetail.studentBankId,
        studentIFSCCode: student.studentDocumentDetail.studentIFSCCode ?? '',
        fatherAdharNumber: student.studentDocumentDetail.fatherAdharNumber ?? '',
        parentAccountNumber: student.studentDocumentDetail.parentAccountNumber ?? '',
        parentBankId: student.studentDocumentDetail.parentBankId,
        parentBankIFSCCode: student.studentDocumentDetail.parentBankIFSCCode ?? '',
        motherAdharNumber: student.studentDocumentDetail.motherAdharNumber ?? '',
        registrationNumber: student.studentDocumentDetail.registrationNumber ?? '',
        annualIncome: student.studentDocumentDetail.annualIncome,
      },
      studentFamilyDetail: {
        fatherContactNumber: student.studentFamilyDetail.fatherContactNumber ?? '',
        fatherEmail: student.studentFamilyDetail.fatherEmail ?? '',
        fatherOccupation: student.studentFamilyDetail.fatherOccupation ?? '',
        fatherQualification: student.studentFamilyDetail.fatherQualification ?? '',
        motherMobileNumber: student.studentFamilyDetail.motherMobileNumber ?? '',
        motherEmail: student.studentFamilyDetail.motherEmail ?? '',
        motherOccupation: student.studentFamilyDetail.motherOccupation ?? '',
        motherQualification: student.studentFamilyDetail.motherQualification ?? '',
        parentMobileNumber: student.studentFamilyDetail.parentMobileNumber ?? '',
        parentEmail: student.studentFamilyDetail.parentEmail ?? '',
        parentOccupation: student.studentFamilyDetail.parentOccupation ?? '',
        parentQualification: student.studentFamilyDetail.parentQualification ?? '',
        studentEmail: student.studentFamilyDetail.studentEmail ?? '',
        isSMSFacility: student.studentFamilyDetail.isSMSFacility,
        sMSMobileNumber: student.studentFamilyDetail.sMSMobileNumber ?? '',
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Fill in the required fields before saving.');
      return;
    }

    const value = this.form.getRawValue();
    const student: Student = {
      id: this.studentId,
      ...value,
      // Required validators on both controls guarantee these are non-null once form.invalid is false.
      studentClassSection: {
        classSectionId: value.studentClassSection.classSectionId as number,
        sessionYearId: value.studentClassSection.sessionYearId as number,
      },
      studentAdmissionDetail: {
        ...value.studentAdmissionDetail,
        isBus: this.existingIsBus,
        busStoppageId: this.existingBusStoppageId,
      },
      uploadDocument: this.documentRows()
        .filter((row) => row.file)
        .map((row) => ({ documentMasterId: row.documentMasterId, file: row.file, documentName: null, fileName: null })),
      generatedUserName: null,
      generatedPassword: null,
    };

    this.saving.set(true);
    this.studentService.createOrUpdateStudent(student).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) {
          this.toast.success(this.isEdit ? 'Student updated.' : 'Student created.');
          if (response.data?.generatedUserName) {
            this.dialog.open(CredentialsDialogComponent, {
              data: {
                title: 'Student login created',
                username: response.data.generatedUserName,
                password: response.data.generatedPassword,
              },
              width: '400px',
            });
          }
          this.router.navigateByUrl('/students');
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to save student.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to save student right now.');
      },
    });
  }

  documentUrl(row: DocumentRow): string | null {
    if (!row.status?.fileName) {
      return null;
    }
    return `${environment.apiBaseUrl}/UploadFiles/Student/${this.studentId}/${row.status.fileName}`;
  }

  cancel(): void {
    this.router.navigateByUrl('/students');
  }

  openIdCard(): void {
    this.router.navigateByUrl(`/students/id-card?studentId=${this.studentId}`);
  }

  openBonafideCertificate(): void {
    this.router.navigateByUrl(`/students/bonafide-certificate?studentId=${this.studentId}`);
  }

  openTransferCertificate(): void {
    this.router.navigateByUrl(`/students/transfer-certificate?studentId=${this.studentId}`);
  }
}
