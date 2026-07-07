export const BORROWER_TYPE = {
  Student: 1,
  Employee: 2,
} as const;

export const BORROWER_TYPE_LABEL: Partial<Record<number, string>> = {
  [BORROWER_TYPE.Student]: 'Student',
  [BORROWER_TYPE.Employee]: 'Employee',
};

export const BOOK_ISSUE_STATUS = {
  Issued: 1,
  Returned: 2,
} as const;

export const BOOK_ISSUE_STATUS_LABEL: Partial<Record<number, string>> = {
  [BOOK_ISSUE_STATUS.Issued]: 'Issued',
  [BOOK_ISSUE_STATUS.Returned]: 'Returned',
};

export interface Book {
  id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  category: string | null;
  publisher: string | null;
  totalCopies: number;
  isActive: boolean;
}

export interface BookListItem {
  id: number;
  title: string | null;
  author: string | null;
  isbn: string | null;
  category: string | null;
  publisher: string | null;
  totalCopies: number;
  availableCopies: number;
  isActive: boolean;
}

export interface IssueBookRequest {
  bookId: number;
  borrowerType: number;
  borrowerId: number;
  dueDate: string;
}

export interface BookIssueListItem {
  id: number;
  bookId: number;
  bookTitle: string | null;
  borrowerType: number;
  borrowerId: number;
  borrowerName: string | null;
  issueDate: string;
  dueDate: string;
  returnedDate: string | null;
  status: number;
  isOverdue: boolean;
}

export interface LibraryActionResult {
  isSuccess: boolean;
  errorMessage: string | null;
}
