import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ADMISSION_STATUS, ADMISSION_STATUS_LABEL, AdmissionApplication, AdmissionExistingDocument } from '../../../core/models/admission.model';
import { MASTER_KEY, MasterKeyDataValue } from '../../../core/models/master.model';
import { ClassWithSectionsDto } from '../../../core/models/setup.model';
import { AdmissionService } from '../../../core/services/admission.service';
import { MasterService } from '../../../core/services/master.service';
import { SetupService } from '../../../core/services/setup.service';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { FileUploadComponent } from '../../../shared/file-upload/file-upload.component';
import { ToastService } from '../../../shared/toast/toast.service';

interface DocumentRow {
  documentMasterId: number;
  documentName: string;
  file: File | null;
  existing: AdmissionExistingDocument | null;
}

@Component({
  selector: 'app-admission-form',
  standalone: true,
  imports: [
    FieldErrorComponent,
    FileUploadComponent,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './admission-form.component.html',
  styleUrl: './admission-form.component.scss',
})
export class AdmissionFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly admissionService = inject(AdmissionService);
  private readonly masterService = inject(MasterService);
  private readonly setupService = inject(SetupService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly ADMISSION_STATUS = ADMISSION_STATUS;
  readonly ADMISSION_STATUS_LABEL = ADMISSION_STATUS_LABEL;

  private readonly applicationId = Number(this.route.snapshot.paramMap.get('id') ?? 0);
  readonly isEdit = this.applicationId > 0;

  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);
  readonly status = signal<number>(ADMISSION_STATUS.Enquiry);
  readonly rejectionReason = signal<string | null>(null);

  readonly genders = signal<MasterKeyDataValue[]>([]);
  readonly admissionSchemes = signal<MasterKeyDataValue[]>([]);
  readonly admissionTypes = signal<MasterKeyDataValue[]>([]);
  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly documentRows = signal<DocumentRow[]>([]);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    fatherName: [''],
    motherName: [''],
    contactNumber: ['', Validators.required],
    email: ['', Validators.email],
    dob: [''],
    genderId: [null as number | null],
    classAppliedForId: [null as number | null],
    schemeId: [null as number | null],
    admissionTypeId: [null as number | null],
    address: [''],
    source: [''],
    remarks: [''],
  });

  get readOnly(): boolean {
    return this.status() === ADMISSION_STATUS.Confirmed;
  }

  get canSaveAsEnquiry(): boolean {
    return !this.isEdit || this.status() === ADMISSION_STATUS.Enquiry;
  }

  ngOnInit(): void {
    forkJoin({
      keyData: this.masterService.getMasterKeyData([MASTER_KEY.Gender, MASTER_KEY.AdmissionScheme, MASTER_KEY.AdmissionType]),
      classSections: this.setupService.getAllClassesWithSections(),
      documentTypes: this.admissionService.getAdmissionAddDocumentMasterList(),
    }).subscribe({
      next: (result) => {
        const keyData = result.keyData.data ?? [];
        this.genders.set(keyData.filter((item) => item.keyId === MASTER_KEY.Gender));
        this.admissionSchemes.set(keyData.filter((item) => item.keyId === MASTER_KEY.AdmissionScheme));
        this.admissionTypes.set(keyData.filter((item) => item.keyId === MASTER_KEY.AdmissionType));
        this.classSections.set(result.classSections.data ?? []);

        const documentTypes = result.documentTypes.data ?? [];
        this.documentRows.set(
          documentTypes.map((docType) => ({
            documentMasterId: docType.id,
            documentName: docType.documentName ?? '',
            file: null,
            existing: null,
          })),
        );

        if (this.isEdit) {
          this.loadApplication();
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load form lookups.');
      },
    });
  }

  private loadApplication(): void {
    this.admissionService.getAdmissionApplication(this.applicationId).subscribe({
      next: (response) => {
        const application = response.data;
        if (!application) {
          this.toast.error('Application not found.');
          this.router.navigateByUrl('/admission');
          return;
        }
        this.patchForm(application);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load this application.');
      },
    });
  }

  private patchForm(application: AdmissionApplication): void {
    this.status.set(application.status);
    this.rejectionReason.set(application.rejectionReason);
    this.form.patchValue({
      name: application.name,
      fatherName: application.fatherName ?? '',
      motherName: application.motherName ?? '',
      contactNumber: application.contactNumber ?? '',
      email: application.email ?? '',
      dob: application.dob ? application.dob.substring(0, 10) : '',
      genderId: application.genderId,
      classAppliedForId: application.classAppliedForId,
      schemeId: application.schemeId,
      admissionTypeId: application.admissionTypeId,
      address: application.address ?? '',
      source: application.source ?? '',
      remarks: application.remarks ?? '',
    });

    const existingDocuments = application.existingDocuments ?? [];
    this.documentRows.update((rows) =>
      rows.map((row) => ({ ...row, existing: existingDocuments.find((doc) => doc.documentMasterId === row.documentMasterId) ?? null })),
    );

    if (this.readOnly) {
      this.form.disable();
    }
  }

  documentUrl(row: DocumentRow): string | null {
    if (!row.existing?.fileName) {
      return null;
    }
    return `${environment.apiBaseUrl}/UploadFiles/Admission/${this.applicationId}/${row.existing.fileName}`;
  }

  saveAsEnquiry(): void {
    if (!this.form.controls.name.value || !this.form.controls.contactNumber.value) {
      this.form.controls.name.markAsTouched();
      this.form.controls.contactNumber.markAsTouched();
      this.toast.error('Name and contact number are required.');
      return;
    }
    this.save(ADMISSION_STATUS.Enquiry);
  }

  submitApplication(): void {
    const value = this.form.getRawValue();
    const requiredFilled = value.name && value.contactNumber && value.dob && value.genderId && value.classAppliedForId && value.fatherName;
    if (!requiredFilled) {
      this.form.markAllAsTouched();
      this.toast.error('Fill in name, contact, DOB, gender, father’s name, and class before submitting the application.');
      return;
    }
    this.save(ADMISSION_STATUS.Applied);
  }

  private save(targetStatus: number): void {
    const value = this.form.getRawValue();
    const application: AdmissionApplication = {
      id: this.applicationId,
      name: value.name,
      fatherName: value.fatherName || null,
      motherName: value.motherName || null,
      contactNumber: value.contactNumber,
      email: value.email || null,
      dob: value.dob || null,
      genderId: value.genderId,
      classAppliedForId: value.classAppliedForId,
      schemeId: value.schemeId,
      admissionTypeId: value.admissionTypeId,
      address: value.address || null,
      source: value.source || null,
      remarks: value.remarks || null,
      status: targetStatus,
      rejectionReason: null,
      confirmedStudentId: null,
      uploadDocument: this.documentRows()
        .filter((row) => row.file)
        .map((row) => ({ documentMasterId: row.documentMasterId, file: row.file, documentName: null, fileName: null })),
      existingDocuments: null,
    };

    this.saving.set(true);
    this.admissionService.createOrUpdateAdmissionApplication(application).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) {
          this.toast.success(targetStatus === ADMISSION_STATUS.Enquiry ? 'Enquiry saved.' : 'Application submitted.');
          this.router.navigateByUrl('/admission');
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to save this application.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to save this application right now.');
      },
    });
  }

  cancel(): void {
    this.router.navigateByUrl('/admission');
  }
}
