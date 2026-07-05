import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AttendanceRecordDTO,
  EditAttendanceRequest,
  MarkAttendanceRequest,
  MonthlyAttendanceRegisterDTO,
  StudentAttendanceSummaryDTO,
} from '../models/attendance.model';
import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class AttendanceService extends ApiBaseService {
  protected readonly controllerName = 'Attendance';

  markAttendance(request: MarkAttendanceRequest): Observable<BaseResponse<boolean>> {
    const body: BaseRequest<MarkAttendanceRequest> = { data: request };
    return this.post('MarkAttendance', body);
  }

  editAttendance(request: EditAttendanceRequest): Observable<BaseResponse<boolean>> {
    const body: BaseRequest<EditAttendanceRequest> = { data: request };
    return this.post('EditAttendance', body);
  }

  getAttendanceByClassSectionAndDate(classSectionId: number, date: string): Observable<BaseResponse<AttendanceRecordDTO[]>> {
    return this.get('GetAttendanceByClassSectionAndDate', { classSectionId, date });
  }

  getMonthlyRegister(
    classSectionId: number,
    year: number,
    month: number,
    sessionYearId?: number | null,
  ): Observable<BaseResponse<MonthlyAttendanceRegisterDTO>> {
    return this.get('GetMonthlyRegister', { classSectionId, year, month, sessionYearId });
  }

  getStudentAttendancePercentage(
    studentId: number,
    sessionYearId?: number | null,
  ): Observable<BaseResponse<StudentAttendanceSummaryDTO>> {
    return this.get('GetStudentAttendancePercentage', { studentId, sessionYearId });
  }
}
