import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { DocumentOwnerType, DocumentStatusDTO, VerifyDocumentRequest } from '../models/document-verification.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class DocumentVerificationService extends ApiBaseService {
  protected readonly controllerName = 'DocumentVerification';

  verifyDocument(request: VerifyDocumentRequest): Observable<BaseResponse<boolean>> {
    const body: BaseRequest<VerifyDocumentRequest> = { data: request };
    return this.post('VerifyDocument', body);
  }

  getPendingDocuments(documentType?: DocumentOwnerType | null): Observable<BaseResponse<DocumentStatusDTO[]>> {
    return this.get('GetPendingDocuments', { documentType });
  }

  getDocumentsByOwner(documentType: DocumentOwnerType, ownerId: number): Observable<BaseResponse<DocumentStatusDTO[]>> {
    return this.get('GetDocumentsByOwner', { documentType, ownerId });
  }
}
