import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { Notice } from '../models/notice.model';
import { DeactiveRequest } from '../models/shared.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class NoticeService extends ApiBaseService {
  protected readonly controllerName = 'Notice';

  getAllNotices(): Observable<BaseResponse<Notice[]>> {
    return this.get('GetAllNotices');
  }

  getActiveNotices(): Observable<BaseResponse<Notice[]>> {
    return this.get('GetActiveNotices');
  }

  createOrUpdateNotice(notice: Notice): Observable<BaseResponse<Notice>> {
    return this.post('CreateOrUpdateNotice', { data: notice } satisfies BaseRequest<Notice>);
  }

  deactivateNotice(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeactivateNotice', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }
}
