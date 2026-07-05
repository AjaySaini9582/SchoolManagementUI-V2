import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ROLE } from '../../core/constants/roles';
import { AuthService } from '../../core/services/auth.service';

/** Sends a just-landed-on-`/` user to their role's default page. Needed
 * because Students can't see `/dashboard` (blocked server-side to
 * Admin/Teacher/Accountant/Employee) so there's no single static default. */
@Component({
  selector: 'app-home-redirect',
  standalone: true,
  template: '',
})
export class HomeRedirectComponent {
  constructor() {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser();
    const target = user?.roleName === ROLE.Student ? '/my-record' : '/dashboard';
    router.navigateByUrl(target);
  }
}
