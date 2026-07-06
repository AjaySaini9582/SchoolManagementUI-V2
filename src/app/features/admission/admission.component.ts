import { Component, ViewChild, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { ADMISSION_STATUS, ADMISSION_STATUS_LABEL, AdmissionApplicationListItem, AdmissionListRequest } from '../../core/models/admission.model';
import { DataTableRequest, DataTableResponse } from '../../core/models/data-table.model';
import { AdmissionService } from '../../core/services/admission.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { DataTableCellDirective } from '../../shared/data-table/data-table-cell.directive';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { DataTableColumn } from '../../shared/data-table/data-table.model';
import { ToastService } from '../../shared/toast/toast.service';
import { ConfirmToStudentDialogComponent, ConfirmToStudentDialogData } from './confirm-to-student-dialog/confirm-to-student-dialog.component';

@Component({
  selector: 'app-admission',
  standalone: true,
  imports: [DataTableCellDirective, DataTableComponent, MatButtonModule, MatIconModule, MatTabsModule],
  templateUrl: './admission.component.html',
  styleUrl: './admission.component.scss',
})
export class AdmissionComponent {
  private readonly admissionService = inject(AdmissionService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  @ViewChild('enquiryTable') private readonly enquiryTable?: DataTableComponent<AdmissionApplicationListItem, AdmissionListRequest>;
  @ViewChild('pendingTable') private readonly pendingTable?: DataTableComponent<AdmissionApplicationListItem, AdmissionListRequest>;
  @ViewChild('verifiedTable') private readonly verifiedTable?: DataTableComponent<AdmissionApplicationListItem, AdmissionListRequest>;

  // Stable object references — DataTableComponent's [filter] input is watched
  // via ngOnChanges by reference, so a fresh literal here would reload on
  // every change-detection pass instead of just once.
  readonly enquiryFilter: AdmissionListRequest = { status: ADMISSION_STATUS.Enquiry };
  readonly pendingFilter: AdmissionListRequest = { status: ADMISSION_STATUS.Applied };
  readonly verifiedFilter: AdmissionListRequest = { status: ADMISSION_STATUS.Verified };
  readonly rejectedFilter: AdmissionListRequest = { status: ADMISSION_STATUS.Rejected };
  readonly confirmedFilter: AdmissionListRequest = { status: ADMISSION_STATUS.Confirmed };

  readonly baseColumns: DataTableColumn<AdmissionApplicationListItem>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'fatherName', header: "Father's Name" },
    { key: 'contactNumber', header: 'Contact', sortable: true },
    { key: 'classAppliedFor', header: 'Class Applied For' },
    { key: 'status', header: 'Status', cell: (row) => ADMISSION_STATUS_LABEL[row.status] ?? 'Unknown' },
    { key: 'created', header: 'Received', cell: (row) => new Date(row.created).toLocaleDateString() },
  ];

  readonly pendingColumns: DataTableColumn<AdmissionApplicationListItem>[] = [
    ...this.baseColumns,
    { key: 'actions', header: 'Actions', exportable: false },
  ];

  readonly verifiedColumns: DataTableColumn<AdmissionApplicationListItem>[] = [
    ...this.baseColumns,
    { key: 'actions', header: 'Actions', exportable: false },
  ];

  readonly fetchApplications = (
    request: DataTableRequest<AdmissionListRequest>,
  ): Observable<DataTableResponse<AdmissionApplicationListItem>> => this.admissionService.getAdmissionApplicationList(request);

  openCreate(): void {
    this.router.navigateByUrl('/admission/new');
  }

  openRecord(row: AdmissionApplicationListItem): void {
    this.router.navigateByUrl(`/admission/${row.id}`);
  }

  approve(row: AdmissionApplicationListItem): void {
    this.confirmDialog
      .confirm({ title: 'Approve application', message: `Mark ${row.name}'s application as verified?`, confirmLabel: 'Approve' })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.verify(row, true, null);
      });
  }

  reject(row: AdmissionApplicationListItem): void {
    this.confirmDialog
      .confirm({
        title: 'Reject application',
        message: `Reject ${row.name}'s application?`,
        requireReason: true,
        reasonLabel: 'Rejection Reason',
        confirmLabel: 'Reject',
        danger: true,
      })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.verify(row, false, result.reason ?? '');
      });
  }

  private verify(row: AdmissionApplicationListItem, approve: boolean, rejectionReason: string | null): void {
    this.admissionService.verifyAdmissionApplication({ id: row.id, approve, rejectionReason }).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success(approve ? 'Application verified.' : 'Application rejected.');
          this.pendingTable?.reload();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to update this application.');
        }
      },
      error: () => this.toast.error('Unable to update this application right now.'),
    });
  }

  confirmToStudent(row: AdmissionApplicationListItem): void {
    this.dialog
      .open<ConfirmToStudentDialogComponent, ConfirmToStudentDialogData, boolean>(ConfirmToStudentDialogComponent, {
        data: { applicationId: row.id, applicantName: row.name ?? '' },
        width: '420px',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.verifiedTable?.reload();
        }
      });
  }
}
