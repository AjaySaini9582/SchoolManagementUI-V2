import { Routes } from '@angular/router';
import { BarController, BarElement, CategoryScale, Legend, LinearScale, Tooltip } from 'chart.js';
import { provideCharts } from 'ng2-charts';

import { ROLE } from '../../core/constants/roles';
import { roleGuard } from '../../core/guards/role.guard';

/** Own routes file (rather than entries in the top-level `app.routes.ts`) so
 * the `chart.js`/`ng2-charts` imports below live in a chunk that only loads
 * when `/fee` is actually visited — see [[project-school-management-charting]]
 * for why this can't be registered in `app.config.ts`/`app.routes.ts`. */
export const FEE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(ROLE.Admin, ROLE.Accountant)],
    providers: [provideCharts({ registerables: [BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip] })],
    loadComponent: () => import('./fee.component').then((m) => m.FeeComponent),
  },
  {
    path: 'receipt',
    canActivate: [roleGuard(ROLE.Admin, ROLE.Accountant)],
    loadComponent: () => import('./fee-receipt/fee-receipt.component').then((m) => m.FeeReceiptComponent),
  },
];
