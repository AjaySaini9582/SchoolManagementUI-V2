import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { DocumentOwnerType, DocumentStatusDTO } from '../../../core/models/document-verification.model';
import { Employee } from '../../../core/models/employee.model';
import { MASTER_KEY, MasterKeyDataValue } from '../../../core/models/master.model';
import { ClassWithSectionsDto, DepartmentResponseDTO, DesignationResponseDTO, HouseDTO } from '../../../core/models/setup.model';
import { MasterApiResponseDTO } from '../../../core/models/shared.model';
import { DocumentVerificationService } from '../../../core/services/document-verification.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { MasterService } from '../../../core/services/master.service';
import { SetupService } from '../../../core/services/setup.service';
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
  selector: 'app-employee-form',
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
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss',
})
export class EmployeeFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly setupService = inject(SetupService);
  private readonly masterService = inject(MasterService);
  private readonly documentVerificationService = inject(DocumentVerificationService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly employeeId = Number(this.route.snapshot.paramMap.get('id') ?? 0);
  readonly isEdit = this.employeeId > 0;

  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);

  // Lookups
  readonly genders = signal<MasterKeyDataValue[]>([]);
  readonly bloodGroups = signal<MasterKeyDataValue[]>([]);
  readonly roles = signal<MasterApiResponseDTO[]>([]);
  readonly departments = signal<DepartmentResponseDTO[]>([]);
  readonly designations = signal<DesignationResponseDTO[]>([]);
  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly banks = signal<MasterApiResponseDTO[]>([]);
  readonly houses = signal<HouseDTO[]>([]);

  // Documents
  readonly documentRows = signal<DocumentRow[]>([]);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    releativeName: [''],
    genderId: [null as number | null],
    dob: [''],
    roleId: [null as number | null, Validators.required],
    contactNumber: [''],
    emergencyContactNumber: [''],
    email: ['', Validators.email],
    qualification: [''],
    bloodGroupId: [null as number | null],
    joiningDate: [''],
    anniversaryDate: [''],
    address: [''],
    departmentId: [null as number | null],
    designationId: [null as number | null],
    classId: [null as number | null],
    sectionId: [null as number | null],
    houseId: [null as number | null],
    bankId: [null as number | null],
    accountNumber: [''],
    ifscCode: [''],
    adharNumber: [''],
    panNumber: [''],
    expercience: [''],
    salary: [null as number | null],
  });

  ngOnInit(): void {
    forkJoin({
      genderData: this.masterService.getMasterKeyData([MASTER_KEY.Gender, MASTER_KEY.BloodGroup]),
      roles: this.masterService.getAllRoleTypeMaster(),
      departments: this.setupService.getAllDepartment(),
      designations: this.setupService.getAllDesignation(),
      classSections: this.setupService.getAllClassesWithSections(),
      banks: this.masterService.getAllBankMaster(),
      houses: this.setupService.getAllHouse(),
      documentTypes: this.employeeService.getAddDocumentMasterList(),
    }).subscribe({
      next: (result) => {
        const keyData = result.genderData.data ?? [];
        this.genders.set(keyData.filter((item) => item.keyId === MASTER_KEY.Gender));
        this.bloodGroups.set(keyData.filter((item) => item.keyId === MASTER_KEY.BloodGroup));

        this.roles.set(result.roles.data ?? []);
        this.departments.set(result.departments.data ?? []);
        this.designations.set(result.designations.data ?? []);
        this.classSections.set(result.classSections.data ?? []);
        this.banks.set(result.banks.data ?? []);
        this.houses.set(result.houses.data ?? []);

        const documentTypes = result.documentTypes.data ?? [];
        this.documentRows.set(documentTypes.map((docType) => ({ documentMasterId: docType.id, documentName: docType.documentName ?? '', file: null, status: null })));

        if (this.isEdit) {
          this.loadEmployee();
        }
      },
      error: () => this.toast.error('Unable to load form lookups.'),
    });
  }

  sectionsForSelectedClass(): { id: number; name: string }[] {
    return this.classSections().find((cls) => cls.id === this.form.controls.classId.value)?.sections ?? [];
  }

  private loadEmployee(): void {
    this.employeeService.getEmployee(this.employeeId).subscribe({
      next: (response) => {
        const employee = response.data;
        if (!employee) {
          this.toast.error('Employee not found.');
          this.router.navigateByUrl('/employees');
          return;
        }
        this.patchForm(employee);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load employee.');
      },
    });

    this.documentVerificationService.getDocumentsByOwner(DocumentOwnerType.Employee, this.employeeId).subscribe((response) => {
      const statuses = response.data ?? [];
      this.documentRows.update((rows) =>
        rows.map((row) => ({ ...row, status: statuses.find((status) => status.documentName === row.documentName) ?? null })),
      );
    });
  }

  private patchForm(employee: Employee): void {
    this.form.patchValue({
      name: employee.name,
      releativeName: employee.releativeName ?? '',
      genderId: employee.genderId,
      dob: employee.dob ?? '',
      roleId: employee.roleId,
      contactNumber: employee.contactNumber ?? '',
      emergencyContactNumber: employee.emergencyContactNumber ?? '',
      email: employee.email ?? '',
      qualification: employee.qualification ?? '',
      bloodGroupId: employee.bloodGroupId,
      joiningDate: employee.joiningDate ?? '',
      anniversaryDate: employee.anniversaryDate ?? '',
      address: employee.address ?? '',
      departmentId: employee.departmentId,
      designationId: employee.designationId,
      classId: employee.classId,
      sectionId: employee.sectionId,
      houseId: employee.houseId,
      bankId: employee.bankId,
      accountNumber: employee.accountNumber ?? '',
      ifscCode: employee.ifscCode ?? '',
      adharNumber: employee.adharNumber ?? '',
      panNumber: employee.panNumber ?? '',
      expercience: employee.expercience ?? '',
      salary: employee.salary,
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Fill in the required fields before saving.');
      return;
    }

    const value = this.form.getRawValue();
    const employee: Employee = {
      id: this.employeeId,
      ...value,
      // Required validator on the control guarantees this is non-null once form.invalid is false.
      roleId: value.roleId as number,
      uploadDocument: this.documentRows()
        .filter((row) => row.file)
        .map((row) => ({ documentMasterId: row.documentMasterId, file: row.file, documentName: null, fileName: null })),
      generatedUserName: null,
      generatedPassword: null,
    };

    this.saving.set(true);
    this.employeeService.createOrUpdateEmployee(employee).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) {
          this.toast.success(this.isEdit ? 'Employee updated.' : 'Employee created.');
          if (response.data?.generatedUserName) {
            this.dialog.open(CredentialsDialogComponent, {
              data: {
                title: 'Employee login created',
                username: response.data.generatedUserName,
                password: response.data.generatedPassword,
              },
              width: '400px',
            });
          }
          this.router.navigateByUrl('/employees');
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to save employee.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to save employee right now.');
      },
    });
  }

  documentUrl(row: DocumentRow): string | null {
    if (!row.status?.fileName) {
      return null;
    }
    return `${environment.apiBaseUrl}/UploadFiles/Employee/${this.employeeId}/${row.status.fileName}`;
  }

  cancel(): void {
    this.router.navigateByUrl('/employees');
  }
}
