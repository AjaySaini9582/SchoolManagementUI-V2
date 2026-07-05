import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { SessionResponseDTO } from '../../../core/models/setup.model';
import { SessionContextService } from '../../../core/services/session-context.service';
import { SetupService } from '../../../core/services/setup.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-sessions-tab',
  standalone: true,
  imports: [
    EmptyStateComponent,
    FieldErrorComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './sessions-tab.component.html',
  styleUrl: './sessions-tab.component.scss',
})
export class SessionsTabComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly sessionContext = inject(SessionContextService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly sessions = signal<SessionResponseDTO[]>([]);
  readonly displayedColumns = ['session', 'status', 'actions'];

  readonly form = this.formBuilder.nonNullable.group({
    start: [null as number | null, [Validators.required, Validators.min(2000)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.setupService.getAllCreateSession().subscribe({
      next: (response) => {
        this.sessions.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load sessions.');
      },
    });
  }

  createSession(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const start = this.form.getRawValue().start as number;
    this.creating.set(true);
    this.setupService.createSession({ start }).subscribe({
      next: (response) => {
        this.creating.set(false);
        if (response.isSuccess) {
          this.toast.success('Session created.');
          this.form.reset();
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to create session.');
        }
      },
      error: () => {
        this.creating.set(false);
        this.toast.error('Unable to create session right now.');
      },
    });
  }

  setActive(session: SessionResponseDTO): void {
    this.setupService.setActiveSession(session.id).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success(`${session.start} - ${session.end} is now the active session.`);
          this.sessionContext.setActiveSession(session);
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to set active session.');
        }
      },
      error: () => this.toast.error('Unable to set active session right now.'),
    });
  }

  confirmDeactivate(session: SessionResponseDTO): void {
    this.confirmDialog
      .confirm({
        title: 'Deactivate session',
        message: `Deactivate ${session.start} - ${session.end}?`,
        confirmLabel: 'Deactivate',
        danger: true,
      })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.setupService.deactiveSessionById(session.id).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Session deactivated.');
              this.load();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to deactivate session.');
            }
          },
          error: () => this.toast.error('Unable to deactivate session right now.'),
        });
      });
  }
}
