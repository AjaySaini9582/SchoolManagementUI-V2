import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseResponse } from '../models/base-response.model';
import { ActivityLogEntry } from '../models/activity-log.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class ActivityLogService extends ApiBaseService {
  protected readonly controllerName = 'ActivityLog';

  getRecentActivity(
    fromDate?: string | null,
    toDate?: string | null,
    maxResults?: number | null,
  ): Observable<BaseResponse<ActivityLogEntry[]>> {
    return this.get('GetRecentActivity', { fromDate, toDate, maxResults });
  }
}
