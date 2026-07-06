import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { DeactiveRequest } from '../models/shared.model';
import { TimetablePeriod, TimetablePeriodListItem } from '../models/timetable.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class TimetableService extends ApiBaseService {
  protected readonly controllerName = 'Timetable';

  getTimetable(classSectionId: number): Observable<BaseResponse<TimetablePeriodListItem[]>> {
    return this.get('GetTimetable', { classSectionId });
  }

  createOrUpdatePeriod(period: TimetablePeriod): Observable<BaseResponse<TimetablePeriod>> {
    return this.post('CreateOrUpdatePeriod', { data: period } satisfies BaseRequest<TimetablePeriod>);
  }

  deletePeriod(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeletePeriod', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  getMyTimetable(): Observable<BaseResponse<TimetablePeriodListItem[]>> {
    return this.get('GetMyTimetable');
  }
}
