import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { SchoolProfile } from '../models/school.model';
import { AddDocumentMasterList, DeactiveRequest } from '../models/shared.model';
import { toFormData } from '../utils/form-data.util';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class SchoolService extends ApiBaseService {
  protected readonly controllerName = 'School';

  getSchoolData(): Observable<BaseResponse<SchoolProfile>> {
    return this.get('GetSchoolData');
  }

  // `AddOrUpdateSchoolData` binds `[FromForm] BaseRequest<SchoolRequstDTO>`,
  // so every field must be prefixed with "data." — unlike Employee/Student's
  // CreateOrUpdate actions, which bind the entity directly.
  addOrUpdateSchoolData(profile: SchoolProfile): Observable<BaseResponse<boolean>> {
    return this.postForm('AddOrUpdateSchoolData', toFormData(profile, new FormData(), 'data'));
  }

  getAllSchoolDocumentMasterList(): Observable<BaseResponse<AddDocumentMasterList[]>> {
    return this.get('GetAllSchoolDocumentMasterList');
  }

  deleteSchoolDocument(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeleteSchoolDocument', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }
}
