import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';

import { LOGIN_ROLE_OPTIONS } from '../../../core/constants/roles';
import { AuthService } from '../../../core/services/auth.service';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FieldErrorComponent,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly roleOptions = LOGIN_ROLE_OPTIONS;
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    userName: ['', Validators.required],
    password: ['', Validators.required],
    roleId: [null as number | null, Validators.required],
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { userName, password, roleId } = this.form.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.authService.login(userName, password, roleId as number).subscribe({
      next: (result) => {
        this.submitting.set(false);
        if (result.status === 'Success') {
          this.router.navigateByUrl('/');
        } else {
          this.errorMessage.set(result.result?.message ?? 'Invalid username, password, or role.');
        }
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Unable to sign in right now. Please try again.');
      },
    });
  }
}
