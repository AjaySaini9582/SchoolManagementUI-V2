import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import {
  EmployeeAttendanceRecordDTO,
  EmployeeMonthlyAttendanceRegisterDTO,
  MarkEmployeeAttendanceRequest,
} from '../models/employee-attendance.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class EmployeeAttendanceService extends ApiBaseService {
  protected readonly controllerName = 'EmployeeAttendance';

  markEmployeeAttendance(request: MarkEmployeeAttendanceRequest): Observable<BaseResponse<boolean>> {
    return this.post('MarkEmployeeAttendance', { data: request } satisfies BaseRequest<MarkEmployeeAttendanceRequest>);
  }

  getEmployeeAttendanceByDate(date: string, departmentId?: number | null): Observable<BaseResponse<EmployeeAttendanceRecordDTO[]>> {
    return this.get('GetEmployeeAttendanceByDate', { date, departmentId });
  }

  getEmployeeMonthlyRegister(
    year: number,
    month: number,
    departmentId?: number | null,
  ): Observable<BaseResponse<EmployeeMonthlyAttendanceRegisterDTO>> {
    return this.get('GetEmployeeMonthlyRegister', { year, month, departmentId });
  }
}
