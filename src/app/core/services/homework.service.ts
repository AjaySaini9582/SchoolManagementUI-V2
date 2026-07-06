import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { Homework, HomeworkListItem } from '../models/homework.model';
import { DeactiveRequest } from '../models/shared.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class HomeworkService extends ApiBaseService {
  protected readonly controllerName = 'Homework';

  getHomeworkList(classSectionId: number): Observable<BaseResponse<HomeworkListItem[]>> {
    return this.get('GetHomeworkList', { classSectionId });
  }

  createOrUpdateHomework(homework: Homework): Observable<BaseResponse<Homework>> {
    return this.post('CreateOrUpdateHomework', { data: homework } satisfies BaseRequest<Homework>);
  }

  deactivateHomework(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeactivateHomework', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  getMyHomework(): Observable<BaseResponse<HomeworkListItem[]>> {
    return this.get('GetMyHomework');
  }
}
