import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { PayrollActionResult, PayrollListItem, UpdatePayrollDeductionRequest } from '../models/payroll.model';
import { DeactiveRequest } from '../models/shared.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class PayrollService extends ApiBaseService {
  protected readonly controllerName = 'Payroll';

  generatePayroll(month: number, year: number): Observable<BaseResponse<PayrollActionResult>> {
    return this.post('GeneratePayroll', undefined, { month, year });
  }

  getPayrollList(month: number, year: number): Observable<BaseResponse<PayrollListItem[]>> {
    return this.get('GetPayrollList', { month, year });
  }

  updatePayrollDeduction(request: UpdatePayrollDeductionRequest): Observable<BaseResponse<boolean>> {
    return this.post('UpdatePayrollDeduction', { data: request } satisfies BaseRequest<UpdatePayrollDeductionRequest>);
  }

  markPayrollPaid(id: number): Observable<BaseResponse<boolean>> {
    return this.post('MarkPayrollPaid', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  getMyPayslips(): Observable<BaseResponse<PayrollListItem[]>> {
    return this.get('GetMyPayslips');
  }

  getPayslip(id: number): Observable<BaseResponse<PayrollListItem>> {
    return this.get('GetPayslip', { id });
  }
}
