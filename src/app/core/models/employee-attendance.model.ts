export interface MarkEmployeeAttendanceRequest {
  attendanceDate: string;
  entries: EmployeeAttendanceEntry[];
}

export interface EmployeeAttendanceEntry {
  employeeId: number;
  statusId: number;
  remark: string | null;
}

export interface EmployeeAttendanceRecordDTO {
  id: number;
  employeeId: number;
  employeeName: string | null;
  statusId: number;
  statusName: string | null;
  remark: string | null;
}

export interface DailyEmployeeAttendanceEntry {
  date: string;
  statusId: number | null;
  statusName: string | null;
}

export interface EmployeeMonthlyAttendanceRow {
  employeeId: number;
  employeeName: string | null;
  days: DailyEmployeeAttendanceEntry[];
  presentCount: number;
  totalMarkedDays: number;
  attendancePercentage: number;
}

export interface EmployeeMonthlyAttendanceRegisterDTO {
  year: number;
  month: number;
  departmentId: number | null;
  employees: EmployeeMonthlyAttendanceRow[];
}
