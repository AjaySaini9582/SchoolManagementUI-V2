export interface StudentMarkEntry {
  studentId: number;
  marksObtained: number;
  remark?: string | null;
}

export interface SaveMarksRequest {
  classSectionId: number;
  examTypeId: number;
  subjectId: number;
  maxMarks: number;
  entries: StudentMarkEntry[];
}

export interface MarksRecordDTO {
  id: number;
  studentId: number;
  studentName: string | null;
  marksObtained: number;
  maxMarks: number;
  remark: string | null;
}

export interface SubjectMarkRow {
  subjectId: number;
  subjectName: string | null;
  marksObtained: number;
  maxMarks: number;
  isPass: boolean;
}

export interface ReportCardDTO {
  studentId: number;
  studentName: string | null;
  examTypeId: number;
  examTypeName: string | null;
  sessionYearId: number;
  subjects: SubjectMarkRow[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  isPass: boolean;
}
