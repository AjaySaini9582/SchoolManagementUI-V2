export interface CollectFeeRequest {
  studentId: number;
  paymodeId: number;
  feeCategoryId?: number | null;
  amount: number;
  fineAmount: number;
  discountAmount: number;
  paymentDate?: string | null;
  remark?: string | null;
}

export interface FeeReceiptDTO {
  id: number;
  receiptNumber: string | null;
  studentId: number;
  studentName: string | null;
  sessionYearId: number;
  feeCategoryId: number | null;
  paymodeId: number;
  paymodeType: string | null;
  amount: number;
  fineAmount: number;
  discountAmount: number;
  paymentDate: string;
  remark: string | null;
  isCancelled: boolean;
}

export interface CancelReceiptRequest {
  receiptId: number;
  reason: string;
}

export interface FeeDueDTO {
  studentId: number;
  sessionYearId: number;
  expectedTuitionFee: number;
  expectedAdvanceFee: number;
  totalExpected: number;
  totalPaid: number;
  due: number;
}

export interface FeeCollectionReportRow {
  paymodeType: string | null;
  receiptCount: number;
  totalCollected: number;
}

export interface FeeCollectionReportDTO {
  fromDate: string;
  toDate: string;
  totalCollected: number;
  totalReceipts: number;
  byPaymode: FeeCollectionReportRow[];
}
