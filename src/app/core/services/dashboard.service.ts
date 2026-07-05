import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseResponse } from '../models/base-response.model';
import { DashboardSummaryDTO } from '../models/dashboard.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class DashboardService extends ApiBaseService {
  protected readonly controllerName = 'Dashboard';

  getDashboardSummary(sessionYearId?: number | null): Observable<BaseResponse<DashboardSummaryDTO>> {
    return this.get('GetDashboardSummary', { sessionYearId });
  }
}
