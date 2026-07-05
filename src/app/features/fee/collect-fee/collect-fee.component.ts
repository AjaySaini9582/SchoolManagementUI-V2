import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { FeeDueDTO, FeeReceiptDTO } from '../../../core/models/fee.model';
import { MasterApiResponseDTO } from '../../../core/models/shared.model';
import { ClassWithSectionsDto, PaymentModeRequest } from '../../../core/models/setup.model';
import { StudentRosterItem } from '../../../core/models/student.model';
import { FeeService } from '../../../core/services/fee.service';
import { MasterService } from '../../../core/services/master.service';
import { SessionContextService } from '../../../core/services/session-context.service';
import { SetupService } from '../../../core/services/setup.service';
import { StudentService } from '../../../core/services/student.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

function toLocalDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-collect-fee',
  standalone: true,
  imports: [
    EmptyStateComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './collect-fee.component.html',
  styleUrl: './collect-fee.component.scss',
})
export class CollectFeeComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly masterService = inject(MasterService);
  private readonly studentService = inject(StudentService);
  private readonly feeService = inject(FeeService);
  private readonly sessionContext = inject(SessionContextService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly loadingRoster = signal(false);
  readonly loadingStudent = signal(false);
  readonly saving = signal(false);

  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly payModes = signal<PaymentModeRequest[]>([]);
  readonly feeCategories = signal<MasterApiResponseDTO[]>([]);
  readonly roster = signal<StudentRosterItem[]>([]);
  readonly due = signal<FeeDueDTO | null>(null);
  readonly receipts = signal<FeeReceiptDTO[]>([]);

  readonly pickerForm = this.formBuilder.nonNullable.group({
    classSectionId: [null as number | null, Validators.required],
    studentId: [null as number | null, Validators.required],
  });

  readonly collectForm = this.formBuilder.nonNullable.group({
    paymodeId: [null as number | null, Validators.required],
    feeCategoryId: [null as number | null],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    fineAmount: [0],
    discountAmount: [0],
    paymentDate: [toLocalDateInput(new Date()), Validators.required],
    remark: [''],
  });

  constructor() {
    // Reloads the roster whenever the active session changes (e.g. an
    // Admin switches sessions from the topbar while this page is open) —
    // `loadRoster()` reads the session live rather than from a snapshot.
    effect(
      () => {
        this.sessionContext.activeSession();
        this.pickerForm.controls.studentId.setValue(null);
        this.due.set(null);
        this.receipts.set([]);
        this.loadRoster();
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    forkJoin({
      classSections: this.setupService.getAllClassesWithSections(),
      payModes: this.setupService.getAllPayMode(),
      feeCategories: this.masterService.getAllPaymentCategoryMaster(),
      session: this.sessionContext.load(),
    }).subscribe({
      next: (result) => {
        this.classSections.set(result.classSections.data ?? []);
        this.payModes.set((result.payModes.data ?? []).filter((mode) => mode.isActive));
        this.feeCategories.set((result.feeCategories.data ?? []).filter((category) => category.isActive));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load fee collection lookups.');
      },
    });

    this.pickerForm.controls.classSectionId.valueChanges.subscribe(() => {
      this.pickerForm.controls.studentId.setValue(null);
      this.due.set(null);
      this.receipts.set([]);
      this.loadRoster();
    });
    this.pickerForm.controls.studentId.valueChanges.subscribe(() => this.loadStudentContext());
  }

  private loadRoster(): void {
    const classSectionId = this.pickerForm.controls.classSectionId.value;
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

  private loadStudentContext(): void {
    const studentId = this.pickerForm.controls.studentId.value;
    this.due.set(null);
    this.receipts.set([]);
    if (!studentId) {
      return;
    }
    this.loadingStudent.set(true);
    forkJoin({
      due: this.feeService.getFeeDue(studentId),
      receipts: this.feeService.getReceiptsByStudent(studentId),
    }).subscribe({
      next: ({ due, receipts }) => {
        this.due.set(due.data ?? null);
        this.receipts.set(receipts.data ?? []);
        this.loadingStudent.set(false);
      },
      error: () => {
        this.loadingStudent.set(false);
        this.toast.error('Unable to load this student’s fee details.');
      },
    });
  }

  collect(): void {
    const studentId = this.pickerForm.controls.studentId.value;
    if (!studentId || this.collectForm.invalid) {
      this.collectForm.markAllAsTouched();
      this.toast.error('Fill in the required fields before collecting.');
      return;
    }

    const value = this.collectForm.getRawValue();
    this.saving.set(true);
    this.feeService
      .collectFee({
        studentId,
        paymodeId: value.paymodeId as number,
        feeCategoryId: value.feeCategoryId,
        amount: value.amount as number,
        fineAmount: value.fineAmount ?? 0,
        discountAmount: value.discountAmount ?? 0,
        paymentDate: value.paymentDate,
        remark: value.remark || null,
      })
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.isSuccess && response.data) {
            this.toast.success('Fee collected.');
            this.collectForm.reset({
              paymodeId: null,
              feeCategoryId: null,
              amount: null,
              fineAmount: 0,
              discountAmount: 0,
              paymentDate: toLocalDateInput(new Date()),
              remark: '',
            });
            this.loadStudentContext();
            this.router.navigate(['/fee/receipt'], { queryParams: { studentId, receiptId: response.data.id } });
          } else {
            this.toast.error(response.errorMessage ?? 'Unable to collect fee.');
          }
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Unable to collect fee right now.');
        },
      });
  }

  viewReceipt(receipt: FeeReceiptDTO): void {
    this.router.navigate(['/fee/receipt'], { queryParams: { studentId: receipt.studentId, receiptId: receipt.id } });
  }

  cancelReceipt(receipt: FeeReceiptDTO): void {
    this.confirmDialog
      .confirm({
        title: 'Cancel receipt',
        message: `Cancel receipt ${receipt.receiptNumber}? This cannot be undone.`,
        requireReason: true,
        reasonLabel: 'Cancellation Reason',
        confirmLabel: 'Cancel Receipt',
        danger: true,
      })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.feeService.cancelReceipt({ receiptId: receipt.id, reason: result.reason ?? '' }).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Receipt cancelled.');
              this.loadStudentContext();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to cancel receipt.');
            }
          },
          error: () => this.toast.error('Unable to cancel receipt right now.'),
        });
      });
  }
}
