import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { DataTableRequest, DataTableResponse, ProcessesRequest } from '../models/data-table.model';
import { AddDocumentMasterList, DataAddedOrUpdated, DataExist } from '../models/shared.model';
import {
  BulkImportResult,
  PromoteStudentsRequest,
  PromoteStudentsResult,
  Student,
  StudentBulkImportRow,
  StudentRosterItem,
  StudentStoreProcedure,
} from '../models/student.model';
import { toFormData } from '../utils/form-data.util';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class StudentService extends ApiBaseService {
  protected readonly controllerName = 'Student';

  getAddDocumentMasterList(): Observable<BaseResponse<AddDocumentMasterList[]>> {
    return this.get('GetStudentAddDocumentMasterList');
  }

  getStudentDetail(id: number): Observable<BaseResponse<Student>> {
    return this.get('GetStudentDetail', { Id: id });
  }

  createOrUpdateStudent(student: Student): Observable<BaseResponse<DataAddedOrUpdated>> {
    return this.postForm('CreateOrUpdateStudent', toFormData(student));
  }

  promoteStudents(request: PromoteStudentsRequest): Observable<BaseResponse<PromoteStudentsResult>> {
    const body: BaseRequest<PromoteStudentsRequest> = { data: request };
    return this.post('PromoteStudents', body);
  }

  getStudentRoster(sessionYearId: number, classSectionId: number): Observable<BaseResponse<StudentRosterItem[]>> {
    return this.get('GetStudentRoster', { SessionYearId: sessionYearId, ClassSectionId: classSectionId });
  }

  bulkImportStudents(rows: StudentBulkImportRow[]): Observable<BaseResponse<BulkImportResult>> {
    const body: BaseRequest<StudentBulkImportRow[]> = { data: rows };
    return this.post('BulkImportStudents', body);
  }

  getStudentList(request: DataTableRequest<ProcessesRequest>): Observable<DataTableResponse<StudentStoreProcedure>> {
    return this.post('GetStudentList', request);
  }

  deleteDocument(id: number): Observable<BaseResponse<DataExist>> {
    return this.get('DeleteDocument', { Id: id });
  }
}
