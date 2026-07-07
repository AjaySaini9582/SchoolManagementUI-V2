import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import {
  AllocateRoomRequest,
  HostelAllocationListItem,
  HostelRoom,
  HostelRoomListItem,
} from '../models/hostel.model';
import { DeactiveRequest } from '../models/shared.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class HostelService extends ApiBaseService {
  protected readonly controllerName = 'Hostel';

  getRoomList(): Observable<BaseResponse<HostelRoomListItem[]>> {
    return this.get('GetRoomList');
  }

  createOrUpdateRoom(room: HostelRoom): Observable<BaseResponse<boolean>> {
    return this.post('CreateOrUpdateRoom', { data: room } satisfies BaseRequest<HostelRoom>);
  }

  deactivateRoom(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeactivateRoom', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  allocateRoom(request: AllocateRoomRequest): Observable<BaseResponse<boolean>> {
    return this.post('AllocateRoom', { data: request } satisfies BaseRequest<AllocateRoomRequest>);
  }

  vacateRoom(allocationId: number): Observable<BaseResponse<boolean>> {
    return this.post('VacateRoom', { data: { id: allocationId } } satisfies BaseRequest<DeactiveRequest>);
  }

  getAllAllocations(status: number | null): Observable<BaseResponse<HostelAllocationListItem[]>> {
    return this.get('GetAllAllocations', { status });
  }

  getMyAllocation(): Observable<BaseResponse<HostelAllocationListItem>> {
    return this.get('GetMyAllocation');
  }
}
