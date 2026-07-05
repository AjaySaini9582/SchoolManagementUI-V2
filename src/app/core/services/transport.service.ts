import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { AssignTransportRequest, RouteSummaryDTO, TransportRosterRow } from '../models/transport.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class TransportService extends ApiBaseService {
  protected readonly controllerName = 'Transport';

  assignStudentTransport(request: AssignTransportRequest): Observable<BaseResponse<boolean>> {
    const body: BaseRequest<AssignTransportRequest> = { data: request };
    return this.post('AssignStudentTransport', body);
  }

  /** `studentId` binds from the query string on the backend (bare scalar
   * param on a POST action), not a JSON body. */
  removeStudentTransport(studentId: number): Observable<BaseResponse<boolean>> {
    return this.post('RemoveStudentTransport', {}, { studentId });
  }

  getStudentsByStoppage(busStoppageId: number, sessionYearId?: number | null): Observable<BaseResponse<TransportRosterRow[]>> {
    return this.get('GetStudentsByStoppage', { busStoppageId, sessionYearId });
  }

  getTransportSummary(sessionYearId?: number | null): Observable<BaseResponse<RouteSummaryDTO[]>> {
    return this.get('GetTransportSummary', { sessionYearId });
  }
}
