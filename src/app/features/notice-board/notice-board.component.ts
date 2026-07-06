import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { ROLE } from '../../core/constants/roles';
import { Notice } from '../../core/models/notice.model';
import { AuthService } from '../../core/services/auth.service';
import { NoticeService } from '../../core/services/notice.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../shared/field-error/field-error.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-notice-board',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent, FieldErrorComponent, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, ReactiveFormsModule, SkeletonComponent],
  templateUrl: './notice-board.component.html',
  styleUrl: './notice-board.component.scss',
})
export class NoticeBoardComponent implements OnInit {
  private readonly noticeService = inject(NoticeService);
  private readonly authService = inject(AuthService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly isAdmin = () => this.authService.hasAnyRole(ROLE.Admin);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly notices = signal<Notice[]>([]);

  readonly form = this.formBuilder.nonNullable.group({
    title: ['', Validators.required],
    body: ['', Validators.required],
    publishedOn: ['', Validators.required],
    expiryDate: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const request$ = this.isAdmin() ? this.noticeService.getAllNotices() : this.noticeService.getActiveNotices();
    request$.subscribe({
      next: (response) => {
        this.notices.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load notices.');
      },
    });
  }

  isExpired(notice: Notice): boolean {
    if (!notice.expiryDate) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(notice.expiryDate) < today;
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ title: '', body: '', publishedOn: new Date().toISOString().substring(0, 10), expiryDate: '' });
    this.showForm.set(true);
  }

  openEdit(notice: Notice): void {
    this.editingId.set(notice.id);
    this.form.reset({
      title: notice.title,
      body: notice.body,
      publishedOn: notice.publishedOn.substring(0, 10),
      expiryDate: notice.expiryDate ? notice.expiryDate.substring(0, 10) : '',
    });
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const notice: Notice = {
      id: this.editingId() ?? 0,
      title: value.title,
      body: value.body,
      publishedOn: value.publishedOn,
      expiryDate: value.expiryDate || null,
      isActive: true,
    };
    this.saving.set(true);
    this.noticeService.createOrUpdateNotice(notice).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) {
          this.toast.success('Notice saved.');
          this.showForm.set(false);
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to save notice.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to save notice right now.');
      },
    });
  }

  confirmDeactivate(notice: Notice): void {
    this.confirmDialog
      .confirm({ title: 'Remove notice', message: `Remove "${notice.title}" from the notice board?`, confirmLabel: 'Remove', danger: true })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.noticeService.deactivateNotice(notice.id).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Notice removed.');
              this.load();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to remove notice.');
            }
          },
          error: () => this.toast.error('Unable to remove notice right now.'),
        });
      });
  }
}
