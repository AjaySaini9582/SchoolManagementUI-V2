import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import {
  InventoryItem,
  InventoryItemListItem,
  InventoryTransactionListItem,
  RecordTransactionRequest,
} from '../models/inventory.model';
import { DeactiveRequest } from '../models/shared.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class InventoryService extends ApiBaseService {
  protected readonly controllerName = 'Inventory';

  getItemList(): Observable<BaseResponse<InventoryItemListItem[]>> {
    return this.get('GetItemList');
  }

  createOrUpdateItem(item: InventoryItem): Observable<BaseResponse<boolean>> {
    return this.post('CreateOrUpdateItem', { data: item } satisfies BaseRequest<InventoryItem>);
  }

  deactivateItem(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeactivateItem', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  recordTransaction(request: RecordTransactionRequest): Observable<BaseResponse<boolean>> {
    return this.post('RecordTransaction', { data: request } satisfies BaseRequest<RecordTransactionRequest>);
  }

  getTransactionHistory(itemId: number | null): Observable<BaseResponse<InventoryTransactionListItem[]>> {
    return this.get('GetTransactionHistory', { itemId });
  }
}
