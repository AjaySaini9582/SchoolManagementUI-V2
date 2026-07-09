import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { BaseResponse } from '../models/base-response.model';
import { MasterKeyDataValue } from '../models/master.model';
import { MasterApiResponseDTO } from '../models/shared.model';
import { ApiBaseService } from './api-base.service';

/** Generic lookups (Gender, Blood Group, Religion, Banks, ...) used across
 * Student/Employee/Attendance forms. Static lookups are cached for the
 * lifetime of the app (`shareReplay(1)`) since they never change mid-session
 * — every caller gets the same in-flight/cached request instead of
 * re-fetching on every form open. */
@Injectable({ providedIn: 'root' })
export class MasterService extends ApiBaseService {
  protected readonly controllerName = 'Master';

  private readonly bankMaster$ = this.get<BaseResponse<MasterApiResponseDTO[]>>('GetAllBankMaster').pipe(shareReplay(1));
  private readonly paymentCategoryMaster$ = this.get<BaseResponse<MasterApiResponseDTO[]>>('GetAllPaymentCategoryMaster').pipe(
    shareReplay(1),
  );
  private readonly roleTypeMaster$ = this.get<BaseResponse<MasterApiResponseDTO[]>>('GetAllRoleTypeMaster').pipe(shareReplay(1));
  private readonly casteCategoryMaster$ = this.get<BaseResponse<MasterApiResponseDTO[]>>('GetAllCasteCategoryMaster').pipe(
    shareReplay(1),
  );
  private readonly masterKeyDataCache = new Map<string, Observable<BaseResponse<MasterKeyDataValue[]>>>();

  getAllBankMaster(): Observable<BaseResponse<MasterApiResponseDTO[]>> {
    return this.bankMaster$;
  }

  getAllPaymentCategoryMaster(): Observable<BaseResponse<MasterApiResponseDTO[]>> {
    return this.paymentCategoryMaster$;
  }

  getAllRoleTypeMaster(): Observable<BaseResponse<MasterApiResponseDTO[]>> {
    return this.roleTypeMaster$;
  }

  getAllCasteCategoryMaster(): Observable<BaseResponse<MasterApiResponseDTO[]>> {
    return this.casteCategoryMaster$;
  }

  /** Batched lookup for one or more `MASTER_KEY` groups, e.g.
   * `getMasterKeyData([MASTER_KEY.Gender, MASTER_KEY.BloodGroup])`. */
  getMasterKeyData(keyList: number[]): Observable<BaseResponse<MasterKeyDataValue[]>> {
    const cacheKey = [...keyList].sort((a, b) => a - b).join(',');
    let cached = this.masterKeyDataCache.get(cacheKey);
    if (!cached) {
      cached = this.get<BaseResponse<MasterKeyDataValue[]>>('GetMasterKeyData', { KeyList: keyList }).pipe(shareReplay(1));
      this.masterKeyDataCache.set(cacheKey, cached);
    }
    return cached;
  }
}
