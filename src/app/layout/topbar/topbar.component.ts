import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';

import { ROLE } from '../../core/constants/roles';
import { SessionResponseDTO } from '../../core/models/setup.model';
import { AuthService } from '../../core/services/auth.service';
import { SchoolProfileContextService } from '../../core/services/school-profile-context.service';
import { SessionContextService } from '../../core/services/session-context.service';
import { SetupService } from '../../core/services/setup.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatMenuModule, MatSelectModule, MatToolbarModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent implements OnInit {
  @Output() readonly menuToggle = new EventEmitter<void>();

  private readonly authService = inject(AuthService);
  private readonly setupService = inject(SetupService);
  private readonly sessionContext = inject(SessionContextService);
  private readonly schoolProfileContext = inject(SchoolProfileContextService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly activeSession = this.sessionContext.activeSession;
  readonly schoolName = () => this.schoolProfileContext.schoolProfile()?.name || 'School Management';
  readonly logoUrl = this.schoolProfileContext.logoUrl;
  readonly isAdmin = () => this.authService.hasAnyRole(ROLE.Admin);

  readonly sessionOptions = signal<SessionResponseDTO[]>([]);

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.setupService.getAllCreateSession().subscribe({
        next: (response) => this.sessionOptions.set(response.data ?? []),
        error: () => this.toast.error('Unable to load sessions.'),
      });
    }
  }

  onSessionChange(sessionId: number): void {
    const selected = this.sessionOptions().find((session) => session.id === sessionId);
    if (!selected) {
      return;
    }
    this.setupService.setActiveSession(sessionId).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.sessionContext.setActiveSession(selected);
        }
      },
      error: () => this.toast.error('Unable to switch session.'),
    });
  }

  changePassword(): void {
    const userName = this.currentUser()?.userName;
    if (!userName) {
      return;
    }
    this.authService.resetPassword(userName).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success('A new password has been generated and sent.');
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to reset password.');
        }
      },
      error: () => this.toast.error('Unable to reset password right now.'),
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
