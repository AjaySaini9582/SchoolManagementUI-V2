export interface StudentAttendanceEntry {
  studentId: number;
  statusId: number;
  remark: string | null;
}

export interface MarkAttendanceRequest {
  classSectionId: number;
  attendanceDate: string;
  entries: StudentAttendanceEntry[];
}

export interface EditAttendanceRequest {
  id: number;
  statusId: number;
  remark: string | null;
}

export interface AttendanceRecordDTO {
  id: number;
  studentId: number;
  studentName: string | null;
  statusId: number;
  statusName: string | null;
  remark: string | null;
}

export interface DailyAttendanceEntry {
  date: string;
  statusId: number | null;
  statusName: string | null;
}

export interface StudentMonthlyAttendanceRow {
  studentId: number;
  studentName: string | null;
  days: DailyAttendanceEntry[];
  presentCount: number;
  totalMarkedDays: number;
  attendancePercentage: number;
}

export interface MonthlyAttendanceRegisterDTO {
  classSectionId: number;
  sessionYearId: number;
  year: number;
  month: number;
  students: StudentMonthlyAttendanceRow[];
}

export interface StudentAttendanceSummaryDTO {
  studentId: number;
  sessionYearId: number;
  presentCount: number;
  totalMarkedDays: number;
  attendancePercentage: number;
}
