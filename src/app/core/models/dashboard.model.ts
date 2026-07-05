export interface ClassEnrollmentRow {
  className: string | null;
  sectionName: string | null;
  studentCount: number;
}

export interface DashboardSummaryDTO {
  sessionYearId: number;
  totalStudents: number;
  totalStaff: number;
  totalFeeCollected: number;
  averageAttendancePercentage: number;
  enrollmentByClass: ClassEnrollmentRow[];
}
