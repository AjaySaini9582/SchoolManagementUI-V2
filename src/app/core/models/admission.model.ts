import { UploadDocument } from './shared.model';

/** Mirrors `SRS.Bal.CoreFunction.AppConstants.AdmissionStatus`. */
export const ADMISSION_STATUS = {
  Enquiry: 1,
  Applied: 2,
  Verified: 3,
  Rejected: 4,
  Confirmed: 5,
} as const;

export const ADMISSION_STATUS_LABEL: Partial<Record<number, string>> = {
  [ADMISSION_STATUS.Enquiry]: 'Enquiry',
  [ADMISSION_STATUS.Applied]: 'Applied',
  [ADMISSION_STATUS.Verified]: 'Verified',
  [ADMISSION_STATUS.Rejected]: 'Rejected',
  [ADMISSION_STATUS.Confirmed]: 'Confirmed',
};

/** Single record covering the whole Enquiry -> Application -> Verification
 * pipeline — the same row is progressively filled in and its `status` advances. */
export interface AdmissionApplication {
  id: number;
  name: string;
  fatherName: string | null;
  motherName: string | null;
  contactNumber: string | null;
  email: string | null;
  dob: string | null;
  genderId: number | null;
  classAppliedForId: number | null;
  schemeId: number | null;
  admissionTypeId: number | null;
  address: string | null;
  source: string | null;
  remarks: string | null;
  status: number;
  rejectionReason: string | null;
  confirmedStudentId: number | null;
  uploadDocument: UploadDocument[] | null;
  existingDocuments: AdmissionExistingDocument[] | null;
}

export interface AdmissionExistingDocument {
  id: number;
  documentMasterId: number;
  documentName: string | null;
  fileName: string | null;
}

export interface AdmissionApplicationListItem {
  id: number;
  name: string | null;
  fatherName: string | null;
  contactNumber: string | null;
  email: string | null;
  classAppliedFor: string | null;
  status: number;
  created: string;
  totalCount: number;
}

export interface AdmissionListRequest {
  status: number | null;
}

export interface VerifyAdmissionApplicationRequest {
  id: number;
  approve: boolean;
  rejectionReason: string | null;
}

export interface ConfirmAdmissionApplicationRequest {
  id: number;
  classSectionId: number;
}

export interface ConfirmAdmissionResult {
  isSuccess: boolean;
  errorMessage: string | null;
  studentId: number | null;
  studentName: string | null;
  contactNumber: string | null;
  email: string | null;
  generatedUserName: string | null;
  generatedPassword: string | null;
}
