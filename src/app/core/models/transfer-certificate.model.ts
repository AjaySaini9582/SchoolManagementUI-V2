export interface TransferCertificate {
  id: number;
  studentId: number;
  tcNumber: string;
  tcDate: string;
  nameOfPupil: string;
  nameOfFatherMotherGuardian: string | null;
  nationality: string | null;
  category: string | null;
  dateOfFirstAdmission: string | null;
  admissionNumber: string | null;
  dateOfBirth: string | null;
  classLastStudied: string | null;
  durationOfStay: string | null;
  lastExamResult: string | null;
  failedInSameClass: boolean;
  subjectsStudied: string | null;
  qualifiedForPromotion: boolean;
  promotedToClass: string | null;
  feesPaidUpToMonth: string | null;
  feeConcessionAvailed: string | null;
  totalWorkingDays: number | null;
  totalPresentDays: number | null;
  extraCurricularActivities: string | null;
  generalConduct: string | null;
  dateOfLeaving: string;
  reasonForLeaving: string | null;
  remarks: string | null;
}
