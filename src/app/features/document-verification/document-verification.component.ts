import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { environment } from '../../../environments/environment';
import { DocumentOwnerType, DocumentStatusDTO } from '../../core/models/document-verification.model';
import { DocumentVerificationService } from '../../core/services/document-verification.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-document-verification',
  standalone: true,
  imports: [EmptyStateComponent, MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule, SkeletonComponent],
  templateUrl: './document-verification.component.html',
  styleUrl: './document-verification.component.scss',
})
export class DocumentVerificationComponent implements OnInit {
  private readonly documentVerificationService = inject(DocumentVerificationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly DocumentOwnerType = DocumentOwnerType;

  readonly loading = signal(true);
  readonly documents = signal<DocumentStatusDTO[]>([]);
  readonly filterType = signal<DocumentOwnerType | null>(null);

  ngOnInit(): void {
    this.load();
  }

  onFilterChange(value: DocumentOwnerType | null): void {
    this.filterType.set(value);
    this.load();
  }

  /** Only Student/Employee uploads sit under a predictable static path keyed
   * by the real owner Id — School documents' `ownerId` is actually a
   * `SchoolDocumentMasterId`, not the school's Id, so there's no reliable
   * link to build for those without a backend change. */
  documentUrl(row: DocumentStatusDTO): string | null {
    if (!row.fileName) {
      return null;
    }
    if (row.documentType === DocumentOwnerType.Student) {
      return `${environment.apiBaseUrl}/UploadFiles/Student/${row.ownerId}/${row.fileName}`;
    }
    if (row.documentType === DocumentOwnerType.Employee) {
      return `${environment.apiBaseUrl}/UploadFiles/Employee/${row.ownerId}/${row.fileName}`;
    }
    return null;
  }

  ownerTypeName(type: DocumentOwnerType): string {
    return DocumentOwnerType[type] ?? 'Unknown';
  }

  private load(): void {
    this.loading.set(true);
    this.documentVerificationService.getPendingDocuments(this.filterType()).subscribe({
      next: (response) => {
        this.documents.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load pending documents.');
      },
    });
  }

  approve(row: DocumentStatusDTO): void {
    this.confirmDialog
      .confirm({
        title: 'Approve document',
        message: `Approve "${row.documentName}" for ${row.ownerName}?`,
        confirmLabel: 'Approve',
      })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.verify(row, true, null);
      });
  }

  reject(row: DocumentStatusDTO): void {
    this.confirmDialog
      .confirm({
        title: 'Reject document',
        message: `Reject "${row.documentName}" for ${row.ownerName}?`,
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

  private verify(row: DocumentStatusDTO, isApproved: boolean, rejectionReason: string | null): void {
    this.documentVerificationService
      .verifyDocument({ documentType: row.documentType, documentId: row.id, isApproved, rejectionReason })
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.toast.success(isApproved ? 'Document approved.' : 'Document rejected.');
            this.load();
          } else {
            this.toast.error(response.errorMessage ?? 'Unable to update this document.');
          }
        },
        error: () => this.toast.error('Unable to update this document right now.'),
      });
  }
}
