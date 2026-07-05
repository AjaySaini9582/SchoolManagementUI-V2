import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { DeactiveRequest, MasterApiResponseDTO } from '../models/shared.model';
import {
  AddSectionRequest,
  AllAsignSubjectDTO,
  AssignSubjectDTO,
  ClassModal,
  ClassWithSectionsDto,
  CreateBusRouteDTO,
  CreateBusStoppageDTO,
  DepartmentRequest,
  DepartmentResponseDTO,
  DesignationRequest,
  DesignationResponseDTO,
  ExamTypeRequest,
  HouseDTO,
  PaymentModeRequest,
  SessionRequest,
  SessionResponseDTO,
} from '../models/setup.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class SetupService extends ApiBaseService {
  protected readonly controllerName = 'Setup';

  // Classes & sections
  getAllClasses(): Observable<BaseResponse<MasterApiResponseDTO[]>> {
    return this.get('GetAllClasses');
  }

  getAllClassesWithSections(): Observable<BaseResponse<ClassWithSectionsDto[]>> {
    return this.get('GetAllClassesWithSections');
  }

  createOrUpdateClass(request: ClassModal): Observable<BaseResponse<boolean>> {
    return this.post('CreateOrUpdateClass', { data: request } satisfies BaseRequest<ClassModal>);
  }

  addSectionToClass(request: AddSectionRequest): Observable<BaseResponse<boolean>> {
    return this.post('AddSectionToClass', { data: request } satisfies BaseRequest<AddSectionRequest>);
  }

  // Sessions
  getAllCreateSession(): Observable<BaseResponse<SessionResponseDTO[]>> {
    return this.get('GetAllCreateSession');
  }

  createSession(request: SessionRequest): Observable<BaseResponse<boolean>> {
    return this.post('CreateSession', { data: request } satisfies BaseRequest<SessionRequest>);
  }

  deactiveSessionById(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeactiveSessionById', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  getActiveSession(): Observable<BaseResponse<SessionResponseDTO>> {
    return this.get('GetActiveSession');
  }

  setActiveSession(id: number): Observable<BaseResponse<boolean>> {
    return this.post('SetActiveSession', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  // Departments
  getAllDepartment(): Observable<BaseResponse<DepartmentResponseDTO[]>> {
    return this.get('GetAllDepartment');
  }

  createOrUpdateDepartment(request: DepartmentRequest): Observable<BaseResponse<boolean>> {
    return this.post('CreateOrUpdateDepartment', { data: request } satisfies BaseRequest<DepartmentRequest>);
  }

  deactiveDepartmentById(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeactiveDepartmentById', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  // Designations
  getAllDesignation(): Observable<BaseResponse<DesignationResponseDTO[]>> {
    return this.get('GetAllDesignation');
  }

  createOrUpdateDesignation(request: DesignationRequest): Observable<BaseResponse<boolean>> {
    return this.post('CreateOrUpdateDesignation', { data: request } satisfies BaseRequest<DesignationRequest>);
  }

  deactiveDesignationById(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeactiveDesignationById', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  // Payment categories / modes
  getAllPaymentCategoryMaster(): Observable<BaseResponse<MasterApiResponseDTO[]>> {
    return this.get('GetAllPaymentCategoryMaster');
  }

  getAllPayMode(): Observable<BaseResponse<PaymentModeRequest[]>> {
    return this.get('GetAllPayMode');
  }

  createOrUpdatePayMode(request: PaymentModeRequest): Observable<BaseResponse<boolean>> {
    return this.post('CreateOrUpdatePayMode', { data: request } satisfies BaseRequest<PaymentModeRequest>);
  }

  // Exam types
  getAllExamType(): Observable<BaseResponse<ExamTypeRequest[]>> {
    return this.get('GetAllExamType');
  }

  createOrUpdateExamType(request: ExamTypeRequest): Observable<BaseResponse<boolean>> {
    return this.post('CreateOrUpdateExamType', { data: request } satisfies BaseRequest<ExamTypeRequest>);
  }

  // Subjects
  getAllSubject(): Observable<BaseResponse<MasterApiResponseDTO[]>> {
    return this.get('GetAllSubject');
  }

  createOrUpdateSubject(request: MasterApiResponseDTO): Observable<BaseResponse<boolean>> {
    return this.post('CreateOrUpdateSubject', { data: request } satisfies BaseRequest<MasterApiResponseDTO>);
  }

  deactiveSubjectById(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeactiveSubjectById', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  getAllAssignedSubjects(): Observable<BaseResponse<AllAsignSubjectDTO[]>> {
    return this.get('GetAllAssignedSubjects');
  }

  assignSubject(request: AssignSubjectDTO): Observable<BaseResponse<boolean>> {
    return this.post('AssignSubject', { data: request } satisfies BaseRequest<AssignSubjectDTO>);
  }

  deleteAssignSubject(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeleteAssignSubject', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  // Bus routes & stoppages
  getAllBusRoutes(): Observable<BaseResponse<MasterApiResponseDTO[]>> {
    return this.get('GetAllBusRoutes');
  }

  createOrUpdateBusRoute(request: CreateBusRouteDTO): Observable<BaseResponse<boolean>> {
    return this.post('CreateOrUpdateBusRoute', { data: request } satisfies BaseRequest<CreateBusRouteDTO>);
  }

  deactiveBusRouteById(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeactiveBusRouteById', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  getAllBusStoppage(): Observable<BaseResponse<CreateBusStoppageDTO[]>> {
    return this.get('GetAllBusStoppage');
  }

  createOrUpdateBusStoppage(request: CreateBusStoppageDTO): Observable<BaseResponse<boolean>> {
    return this.post('CreateOrUpdateBusStoppage', { data: request } satisfies BaseRequest<CreateBusStoppageDTO>);
  }

  deactiveBusStoppagesById(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeactiveBusStoppagesById', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  // Houses
  getAllHouse(): Observable<BaseResponse<HouseDTO[]>> {
    return this.get('GetAllHouse');
  }

  createOrUpdateHouse(request: HouseDTO): Observable<BaseResponse<boolean>> {
    return this.post('CreateOrUpdateHouse', { data: request } satisfies BaseRequest<HouseDTO>);
  }

  deactiveHouseById(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeactiveHouseById', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }
}
