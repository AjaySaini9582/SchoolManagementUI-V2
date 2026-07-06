import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseResponse } from '../models/base-response.model';
import { DataTableRequest, DataTableResponse, ProcessesRequest } from '../models/data-table.model';
import { Employee, EmployeeStoreProcedure } from '../models/employee.model';
import { AddDocumentMasterList, DataAddedOrUpdated, DataExist, MasterApiResponseDTO } from '../models/shared.model';
import { toFormData } from '../utils/form-data.util';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class EmployeeService extends ApiBaseService {
  protected readonly controllerName = 'Employee';

  getAddDocumentMasterList(): Observable<BaseResponse<AddDocumentMasterList[]>> {
    return this.get('GetEmployeeAddDocumentMasterList');
  }

  getEmployee(id: number): Observable<BaseResponse<Employee>> {
    return this.get('GetEmployee', { Id: id });
  }

  deleteDocument(id: number): Observable<BaseResponse<DataExist>> {
    return this.get('DeleteDocument', { Id: id });
  }

  isEmployeeExist(email: string): Observable<BaseResponse<DataExist>> {
    return this.get('IsEmployeeExist', { Email: email });
  }

  createOrUpdateEmployee(employee: Employee): Observable<BaseResponse<DataAddedOrUpdated>> {
    return this.postForm('CreateOrUpdateEmployee', toFormData(employee));
  }

  getEmployeeList(request: DataTableRequest<ProcessesRequest>): Observable<DataTableResponse<EmployeeStoreProcedure>> {
    return this.post('GetEmployeeList', request);
  }

  getAllTeachers(): Observable<BaseResponse<MasterApiResponseDTO[]>> {
    return this.get('GetAllTeachers');
  }
}
