import { Routes } from '@angular/router';
import { BarController, BarElement, CategoryScale, Legend, LinearScale, Tooltip } from 'chart.js';
import { provideCharts } from 'ng2-charts';

import { staffGuard } from '../../core/guards/role.guard';

/** Own routes file (rather than an entry in the top-level `app.routes.ts`)
 * so the `chart.js`/`ng2-charts` imports below live in a chunk that only
 * loads when `/dashboard` is actually visited — importing them from the
 * eagerly-loaded `app.routes.ts` would pull Chart.js into the initial bundle
 * regardless of route-level `providers` placement. */
export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    // "Staff" = everyone except Student, matching DashboardController's
    // server-side [AuthorizeRoles(Admin, Teacher, Accountant, Employee)].
    canActivate: [staffGuard],
    providers: [provideCharts({ registerables: [BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip] })],
    loadComponent: () => import('./dashboard.component').then((m) => m.DashboardComponent),
  },
];
