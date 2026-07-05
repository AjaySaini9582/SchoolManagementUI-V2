import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ROLE, RoleName } from '../constants/roles';
import { AuthService } from '../services/auth.service';

/** Factory for role-restricted routes. Redirects to `/login` if not
 * authenticated at all, or `/not-authorized` if logged in as the wrong role.
 * Mirrors — but does not replace — the `[AuthorizeRoles(...)]` gates already
 * enforced server-side; this only controls what the UI lets you navigate to. */
export function roleGuard(...allowedRoles: RoleName[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    return authService.hasAnyRole(...allowedRoles) ? true : router.createUrlTree(['/not-authorized']);
  };
}

export const adminGuard: CanActivateFn = roleGuard(ROLE.Admin);

/** "Staff" = everyone except Student. */
export const staffGuard: CanActivateFn = roleGuard(ROLE.Admin, ROLE.Teacher, ROLE.Accountant, ROLE.Employee);
