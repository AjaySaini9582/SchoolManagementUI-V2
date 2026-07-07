import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Employee } from '../../../core/models/employee.model';
import { MASTER_KEY, MasterKeyDataValue } from '../../../core/models/master.model';
import { DepartmentResponseDTO, DesignationResponseDTO } from '../../../core/models/setup.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { MasterService } from '../../../core/services/master.service';
import { SchoolProfileContextService } from '../../../core/services/school-profile-context.service';
import { SetupService } from '../../../core/services/setup.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-employee-id-card',
  standalone: true,
  imports: [EmptyStateComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './employee-id-card.component.html',
  styleUrl: './employee-id-card.component.scss',
})
export class EmployeeIdCardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);
  private readonly setupService = inject(SetupService);
  private readonly masterService = inject(MasterService);
  private readonly toast = inject(ToastService);

  private readonly schoolProfileContext = inject(SchoolProfileContextService);
  readonly schoolProfile = this.schoolProfileContext.schoolProfile;
  readonly logoUrl = this.schoolProfileContext.logoUrl;

  readonly loading = signal(true);
  readonly employee = signal<Employee | null>(null);
  readonly departments = signal<DepartmentResponseDTO[]>([]);
  readonly designations = signal<DesignationResponseDTO[]>([]);
  readonly bloodGroups = signal<MasterKeyDataValue[]>([]);

  ngOnInit(): void {
    const employeeId = Number(this.route.snapshot.queryParamMap.get('employeeId') ?? 0);
    if (!employeeId) {
      this.loading.set(false);
      return;
    }

    forkJoin({
      employee: this.employeeService.getEmployee(employeeId),
      departments: this.setupService.getAllDepartment(),
      designations: this.setupService.getAllDesignation(),
      bloodGroups: this.masterService.getMasterKeyData([MASTER_KEY.BloodGroup]),
      schoolProfile: this.schoolProfileContext.load(),
    }).subscribe({
      next: (result) => {
        this.employee.set(result.employee.data ?? null);
        this.departments.set(result.departments.data ?? []);
        this.designations.set(result.designations.data ?? []);
        this.bloodGroups.set(result.bloodGroups.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load this employee.');
      },
    });
  }

  photoUrl(): string | null {
    const employee = this.employee();
    const fileName = employee?.uploadDocument?.find((doc) => doc.documentName === 'Employee Photo')?.fileName;
    return fileName ? `${environment.apiBaseUrl}/UploadFiles/Employee/${employee!.id}/${fileName}` : null;
  }

  departmentName(): string {
    return this.departments().find((d) => d.id === this.employee()?.departmentId)?.name ?? '—';
  }

  designationName(): string {
    return this.designations().find((d) => d.id === this.employee()?.designationId)?.name ?? '—';
  }

  bloodGroupText(): string {
    const bloodGroupId = this.employee()?.bloodGroupId;
    return this.bloodGroups().find((option) => option.id === bloodGroupId)?.text ?? '—';
  }

  print(): void {
    window.print();
  }

  back(): void {
    this.router.navigateByUrl('/employees');
  }
}
