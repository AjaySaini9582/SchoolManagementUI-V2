import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseResponse } from '../models/base-response.model';
import { DataTableRequest, DataTableResponse, ProcessesRequest } from '../models/data-table.model';
import { UserGridDTO, UserStoreProcedure } from '../models/user.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class UserService extends ApiBaseService {
  protected readonly controllerName = 'User';

  getUserList(request: DataTableRequest<ProcessesRequest>): Observable<DataTableResponse<UserStoreProcedure>> {
    return this.post('GetUserList', request);
  }

  getUserGrid(request: DataTableRequest<ProcessesRequest>): Observable<DataTableResponse<UserGridDTO>> {
    return this.post('GetUserGrid', request);
  }

  adminResetUserPassword(userId: number): Observable<BaseResponse<string>> {
    return this.post('AdminResetUserPassword', {}, { userId });
  }
}
