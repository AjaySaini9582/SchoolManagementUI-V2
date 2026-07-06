import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AdmissionApplication,
  AdmissionApplicationListItem,
  AdmissionListRequest,
  ConfirmAdmissionApplicationRequest,
  ConfirmAdmissionResult,
  VerifyAdmissionApplicationRequest,
} from '../models/admission.model';
import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { DataTableRequest, DataTableResponse } from '../models/data-table.model';
import { AddDocumentMasterList } from '../models/shared.model';
import { toFormData } from '../utils/form-data.util';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class AdmissionService extends ApiBaseService {
  protected readonly controllerName = 'Admission';

  getAdmissionAddDocumentMasterList(): Observable<BaseResponse<AddDocumentMasterList[]>> {
    return this.get('GetAdmissionAddDocumentMasterList');
  }

  getAdmissionApplication(id: number): Observable<BaseResponse<AdmissionApplication>> {
    return this.get('GetAdmissionApplication', { Id: id });
  }

  createOrUpdateAdmissionApplication(application: AdmissionApplication): Observable<BaseResponse<AdmissionApplication>> {
    return this.postForm('CreateOrUpdateAdmissionApplication', toFormData(application));
  }

  getAdmissionApplicationList(
    request: DataTableRequest<AdmissionListRequest>,
  ): Observable<DataTableResponse<AdmissionApplicationListItem>> {
    return this.post('GetAdmissionApplicationList', request);
  }

  verifyAdmissionApplication(request: VerifyAdmissionApplicationRequest): Observable<BaseResponse<boolean>> {
    return this.post('VerifyAdmissionApplication', { data: request } satisfies BaseRequest<VerifyAdmissionApplicationRequest>);
  }

  confirmAdmissionApplication(request: ConfirmAdmissionApplicationRequest): Observable<BaseResponse<ConfirmAdmissionResult>> {
    return this.post('ConfirmAdmissionApplication', { data: request } satisfies BaseRequest<ConfirmAdmissionApplicationRequest>);
  }
}
