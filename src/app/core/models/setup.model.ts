export interface SectionDto {
  id: number;
  name: string;
}

export interface ClassWithSectionsDto {
  id: number;
  name: string;
  sections: SectionDto[];
}

export interface ClassModal {
  id: number;
  name: string;
}

export interface AddSectionRequest {
  classId: number;
}

export interface SessionResponseDTO {
  id: number;
  start: number;
  end: number;
  isActive: boolean;
}

export interface SessionRequest {
  start: number;
}

export interface DepartmentResponseDTO {
  id: number;
  name: string;
  isActive: boolean;
}

export interface DepartmentRequest {
  id: number;
  name: string;
}

export interface DesignationResponseDTO {
  id: number;
  name: string;
  isActive: boolean;
}

export interface DesignationRequest {
  id: number;
  name: string;
}

export interface PaymentModeRequest {
  id: number;
  categoryId: number;
  type: string;
  openingBalance: number;
  isActive: boolean;
}

export interface ExamTypeRequest {
  id: number;
  type: string;
  code: string;
  isReportCard: string;
  semesterId: number;
  isActive: boolean;
}

export interface Subject {
  /** Subject master Id — for display/de-dup only, NOT for `deleteAssignSubject`. */
  id: number;
  subjectName: string;
  /** `Tb_Class_Subject_Xref` row Id — pass this to `deleteAssignSubject`, not `id`. */
  assignmentId: number;
}

export interface AllAsignSubjectDTO {
  classId: number;
  className: string;
  subjects: Subject[];
}

export interface AssignSubjectDTO {
  classId: number;
  subjectId: number;
}

export interface CreateBusRouteDTO {
  id: number;
  name: string;
  isActive: boolean;
}

export interface CreateBusStoppageDTO {
  id: number;
  busRoutId: number;
  name: string;
  arrivalTime: string;
  dispatchTime: string;
  distance: number;
  amount: number;
  isActive: boolean;
}

export interface HouseDTO {
  id: number;
  name: string;
  color: string | null;
  isActive: boolean;
}
