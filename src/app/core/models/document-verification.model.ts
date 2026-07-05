export enum DocumentOwnerType {
  Employee = 1,
  Student = 2,
  School = 3,
}

export interface VerifyDocumentRequest {
  documentType: DocumentOwnerType;
  documentId: number;
  isApproved: boolean;
  rejectionReason: string | null;
}

export interface DocumentStatusDTO {
  id: number;
  documentType: DocumentOwnerType;
  ownerId: number;
  ownerName: string | null;
  documentName: string | null;
  fileName: string | null;
  verificationStatus: number;
  verificationStatusName: string | null;
  verifiedBy: number | null;
  verifiedOn: string | null;
  rejectionReason: string | null;
}
