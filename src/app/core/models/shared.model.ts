export interface AddDocumentMasterList {
  id: number;
  documentName: string | null;
}

export interface DataExist {
  isTrue: boolean;
}

export interface DataAddedOrUpdated {
  isTrue: boolean;
  generatedUserName: string | null;
  generatedPassword: string | null;
}

/** Mirrors `UploadDocument` (Student/Employee DTOs). `file` is appended to
 * FormData separately — see `AppendFormData` usage in Student/Employee services. */
export interface UploadDocument {
  documentMasterId: number;
  documentName: string | null;
  fileName: string | null;
  file: File | null;
}

export interface MasterApiResponseDTO {
  id: number;
  name: string;
  isActive: boolean;
}

export interface DeactiveRequest {
  id: number;
}
