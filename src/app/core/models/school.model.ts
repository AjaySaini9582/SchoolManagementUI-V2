/** Mirrors `Tb_School_BankDTO` (SRS.Bal/DTO/SchoolModel). */
export interface SchoolBank {
  accountTypeId: number | null;
  bankId: number | null;
  accountNumber: string | null;
  ifscCode: string | null;
}

/** Mirrors `Tb_School_Other_InformationDTO`. `pricipalName` keeps the
 * backend's own typo — the JSON property name must match exactly. */
export interface SchoolOtherInformation {
  pricipalName: string | null;
  isEPF: boolean;
  epfAmtPer: number;
  isEPS: boolean;
  epsAmtPer: number;
  schoolPrefix: string | null;
  isFine: boolean;
  fineFromDate: number;
  finePerDayAmount: number;
  isWhatsApp: boolean;
  isSMS: boolean;
  aboutSchool: string | null;
  termsConditionsForStudents: string | null;
  declaration: string | null;
}

/** Mirrors `Tb_School_Upload_DocumentDTO`. `filePath` is only populated on
 * GET (server-computed); `file` is only sent on POST. */
export interface SchoolUploadDocument {
  id: number;
  schoolDocumentMasterId: number;
  fileName: string | null;
  filePath: string | null;
  file: File | null;
}

/** Mirrors `SchoolRequstDTO` — the single school-profile record. The backend
 * resolves "the" school via `Tb_School.FirstOrDefaultAsync()` with no
 * filter, so `id` should be treated as read-only/round-tripped, not relied
 * on to stay stable. */
export interface SchoolProfile {
  id: number;
  affiliationRegdNumber: string | null;
  name: string;
  alternateName: string | null;
  affiliationName: string | null;
  contactNumber: string;
  phoneNumber: string | null;
  smsNumber: string | null;
  email: string | null;
  website: string | null;
  schoolCode: string | null;
  udiseCode: string | null;
  address: string | null;
  schoolBankDTO: SchoolBank | null;
  schoolOtherInformationDTO: SchoolOtherInformation | null;
  uploadDocumentDTO: SchoolUploadDocument[] | null;
}

/** Seeded document-master rows (see core.Tb_School_Document_Master) that the
 * School Profile form treats specially rather than as a generic document row. */
export const SCHOOL_DOCUMENT_NAME = {
  Logo: 'Logo',
  Letterhead: 'Letterhead',
} as const;
