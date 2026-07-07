import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { EmployeeLeave, EmployeeLeaveBalanceDTO, EmployeeLeaveListItem, VerifyEmployeeLeaveRequest } from '../models/employee-leave.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class EmployeeLeaveService extends ApiBaseService {
  protected readonly controllerName = 'EmployeeLeave';

  applyLeave(leave: EmployeeLeave): Observable<BaseResponse<boolean>> {
    return this.post('ApplyLeave', { data: leave } satisfies BaseRequest<EmployeeLeave>);
  }

  getMyLeaves(): Observable<BaseResponse<EmployeeLeaveListItem[]>> {
    return this.get('GetMyLeaves');
  }

  getAllLeaveRequests(status?: number | null): Observable<BaseResponse<EmployeeLeaveListItem[]>> {
    return this.get('GetAllLeaveRequests', { status });
  }

  verifyLeave(request: VerifyEmployeeLeaveRequest): Observable<BaseResponse<boolean>> {
    return this.post('VerifyLeave', { data: request } satisfies BaseRequest<VerifyEmployeeLeaveRequest>);
  }

  getMyLeaveBalance(): Observable<BaseResponse<EmployeeLeaveBalanceDTO>> {
    return this.get('GetMyLeaveBalance');
  }
}
