import { UploadDocument } from './shared.model';

export interface StudentAddress {
  presentAddress: string | null;
  permanentAddress: string | null;
}

export interface StudentAdmissionDetail {
  schemeId: number | null;
  admissionTypeId: number | null;
  guardianName: string | null;
  relation: string | null;
  religionId: number | null;
  casteCategoryId: number | null;
  bloodGroupId: number | null;
  birthPlace: string | null;
  height_In_CM: string | null;
  weight_In_KG: string | null;
  colorVision: string | null;
  previousClassId: number | null;
  previousSchoolName: string | null;
  tC_No: string | null;
  tC_Date: string | null;
  houseId: number | null;
  isCaptainId: number | null;
  isBus: number | null;
  busStoppageId: number | null;
}

export interface StudentClassSection {
  classSectionId: number;
  sessionYearId: number;
}

export interface StudentDocumentDetail {
  studentAdharNumber: string | null;
  studentBankAccountNumber: string | null;
  studentBankId: number | null;
  studentIFSCCode: string | null;
  fatherAdharNumber: string | null;
  parentAccountNumber: string | null;
  parentBankId: number | null;
  parentBankIFSCCode: string | null;
  motherAdharNumber: string | null;
  registrationNumber: string | null;
  annualIncome: number | null;
}

export interface StudentFamilyDetail {
  fatherContactNumber: string | null;
  fatherEmail: string | null;
  fatherOccupation: string | null;
  fatherQualification: string | null;
  motherMobileNumber: string | null;
  motherEmail: string | null;
  motherOccupation: string | null;
  motherQualification: string | null;
  parentMobileNumber: string | null;
  parentEmail: string | null;
  parentOccupation: string | null;
  parentQualification: string | null;
  studentEmail: string | null;
  isSMSFacility: boolean;
  sMSMobileNumber: string | null;
}

export interface Student {
  id: number;
  name: string;
  fatherName: string | null;
  motherName: string | null;
  contactNumber: string | null;
  dob: string | null;
  genderId: number | null;
  admissionNumber: string | null;
  admissionDate: string | null;
  ledgerNumber: string | null;
  rollNumber: number | null;
  srnNumber: string | null;
  permananetEducationNumber: string | null;
  familyId: string | null;
  aaprId: string | null;
  mediumId: number | null;
  enrollmentSchoolName: string | null;
  openingBalance: string | null;
  studentAddress: StudentAddress;
  studentAdmissionDetail: StudentAdmissionDetail;
  studentClassSection: StudentClassSection;
  studentDocumentDetail: StudentDocumentDetail;
  studentFamilyDetail: StudentFamilyDetail;
  uploadDocument: UploadDocument[] | null;
  generatedUserName: string | null;
  generatedPassword: string | null;
}

export interface PromoteStudentsRequest {
  sourceSessionId: number;
  targetSessionId: number;
  sourceClassSectionId: number;
  targetClassSectionId: number;
  studentIds: number[] | null;
}

export interface PromoteStudentsResult {
  isSuccess: boolean;
  message: string | null;
  promotedCount: number;
  promotedStudentIds: number[];
  alreadyPromotedStudentIds: number[];
}

export interface StudentRosterItem {
  id: number;
  name: string | null;
  rollNumber: number | null;
}

/** Minimal fields for bulk creation — everything else (address, admission
 * detail, family, documents) can be filled in via the regular edit form. */
export interface StudentBulkImportRow {
  name: string;
  fatherName: string | null;
  motherName: string | null;
  contactNumber: string | null;
  dob: string | null;
  genderId: number | null;
  admissionNumber: string | null;
  rollNumber: number | null;
  classSectionId: number;
  sessionYearId: number;
}

export interface BulkImportRowError {
  rowNumber: number;
  studentName: string | null;
  errorMessage: string;
}

export interface BulkImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: BulkImportRowError[];
}

export interface StudentStoreProcedure {
  id: number;
  studentName: string | null;
  fatherName: string | null;
  motherName: string | null;
  className: string | null;
  email: string | null;
  sectionName: string | null;
  admissionType: string | null;
  gender: string | null;
  srnNumber: string | null;
  presentAddress: string | null;
  smsMobileNumber: string | null;
  rollNumber: string | null;
  adminssionNumber: string | null;
  ledgerNumber: string | null;
  modified: string | null;
  status: boolean;
  photo: string | null;
  totalCount: number;
}
