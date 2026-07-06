import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import {
  CancelReceiptRequest,
  CollectFeeRequest,
  FeeCollectionReportDTO,
  FeeDueDTO,
  FeeReceiptDTO,
} from '../models/fee.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class FeeService extends ApiBaseService {
  protected readonly controllerName = 'Fee';

  collectFee(request: CollectFeeRequest): Observable<BaseResponse<FeeReceiptDTO>> {
    const body: BaseRequest<CollectFeeRequest> = { data: request };
    return this.post('CollectFee', body);
  }

  cancelReceipt(request: CancelReceiptRequest): Observable<BaseResponse<boolean>> {
    const body: BaseRequest<CancelReceiptRequest> = { data: request };
    return this.post('CancelReceipt', body);
  }

  getReceiptsByStudent(studentId: number, sessionYearId?: number | null): Observable<BaseResponse<FeeReceiptDTO[]>> {
    return this.get('GetReceiptsByStudent', { studentId, sessionYearId });
  }

  getFeeDue(studentId: number, sessionYearId?: number | null): Observable<BaseResponse<FeeDueDTO>> {
    return this.get('GetFeeDue', { studentId, sessionYearId });
  }

  getCollectionReport(fromDate: string, toDate: string): Observable<BaseResponse<FeeCollectionReportDTO>> {
    return this.get('GetCollectionReport', { fromDate, toDate });
  }

  getCollectionReceipts(fromDate: string, toDate: string): Observable<BaseResponse<FeeReceiptDTO[]>> {
    return this.get('GetCollectionReceipts', { fromDate, toDate });
  }

  sendFeeDueReminders(): Observable<BaseResponse<number>> {
    return this.post('SendFeeDueReminders');
  }
}
