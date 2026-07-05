import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { MarksRecordDTO, ReportCardDTO, SaveMarksRequest } from '../models/exam.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class ExamService extends ApiBaseService {
  protected readonly controllerName = 'Exam';

  saveMarks(request: SaveMarksRequest): Observable<BaseResponse<boolean>> {
    const body: BaseRequest<SaveMarksRequest> = { data: request };
    return this.post('SaveMarks', body);
  }

  getMarks(
    classSectionId: number,
    examTypeId: number,
    subjectId: number,
    sessionYearId?: number | null,
  ): Observable<BaseResponse<MarksRecordDTO[]>> {
    return this.get('GetMarks', { classSectionId, examTypeId, subjectId, sessionYearId });
  }

  getReportCard(
    studentId: number,
    examTypeId: number,
    sessionYearId?: number | null,
  ): Observable<BaseResponse<ReportCardDTO>> {
    return this.get('GetReportCard', { studentId, examTypeId, sessionYearId });
  }
}
