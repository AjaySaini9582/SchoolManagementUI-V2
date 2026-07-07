import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { TransferCertificate } from '../models/transfer-certificate.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class TransferCertificateService extends ApiBaseService {
  protected readonly controllerName = 'TransferCertificate';

  getTransferCertificate(studentId: number): Observable<BaseResponse<TransferCertificate>> {
    return this.get('GetTransferCertificate', { studentId });
  }

  createOrUpdateTransferCertificate(certificate: TransferCertificate): Observable<BaseResponse<TransferCertificate>> {
    return this.post('CreateOrUpdateTransferCertificate', { data: certificate } satisfies BaseRequest<TransferCertificate>);
  }
}
