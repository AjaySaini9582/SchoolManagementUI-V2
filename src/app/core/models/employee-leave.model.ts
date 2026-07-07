export const LEAVE_STATUS = {
  Pending: 1,
  Approved: 2,
  Rejected: 3,
} as const;

export const LEAVE_STATUS_LABEL: Partial<Record<number, string>> = {
  [LEAVE_STATUS.Pending]: 'Pending',
  [LEAVE_STATUS.Approved]: 'Approved',
  [LEAVE_STATUS.Rejected]: 'Rejected',
};

export interface EmployeeLeave {
  id: number;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string | null;
}

export interface EmployeeLeaveListItem {
  id: number;
  employeeId: number;
  employeeName: string | null;
  leaveType: string | null;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string | null;
  status: number;
  rejectionReason: string | null;
  created: string;
}

export interface VerifyEmployeeLeaveRequest {
  id: number;
  approve: boolean;
  rejectionReason: string | null;
}

export interface EmployeeLeaveBalanceDTO {
  annualEntitlementDays: number;
  usedDays: number;
  remainingDays: number;
}
