export const PAYROLL_STATUS = {
  Draft: 1,
  Paid: 2,
} as const;

export const PAYROLL_STATUS_LABEL: Partial<Record<number, string>> = {
  [PAYROLL_STATUS.Draft]: 'Draft',
  [PAYROLL_STATUS.Paid]: 'Paid',
};

export interface PayrollListItem {
  id: number;
  employeeId: number;
  employeeName: string | null;
  payrollMonth: number;
  payrollYear: number;
  basicSalary: number;
  epfDeduction: number;
  epsDeduction: number;
  lossOfPayDays: number;
  lossOfPayAmount: number;
  otherDeductions: number;
  netSalary: number;
  status: number;
  paidOn: string | null;
}

export interface UpdatePayrollDeductionRequest {
  id: number;
  otherDeductions: number;
}

export interface PayrollActionResult {
  isSuccess: boolean;
  errorMessage: string | null;
  generatedCount: number;
}
