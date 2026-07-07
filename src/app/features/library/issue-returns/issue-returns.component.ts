import { DatePipe } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';

import { ClassWithSectionsDto, DepartmentResponseDTO } from '../../../core/models/setup.model';
import { MasterApiResponseDTO } from '../../../core/models/shared.model';
import { StudentRosterItem } from '../../../core/models/student.model';
import {
  BOOK_ISSUE_STATUS,
  BOOK_ISSUE_STATUS_LABEL,
  BORROWER_TYPE,
  BORROWER_TYPE_LABEL,
  BookIssueListItem,
  BookListItem,
} from '../../../core/models/library.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { LibraryService } from '../../../core/services/library.service';
import { SessionContextService } from '../../../core/services/session-context.service';
import { SetupService } from '../../../core/services/setup.service';
import { StudentService } from '../../../core/services/student.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

function toLocalDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

@Component({
  selector: 'app-issue-returns',
  standalone: true,
  imports: [
    DatePipe,
    EmptyStateComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './issue-returns.component.html',
  styleUrl: './issue-returns.component.scss',
})
export class IssueReturnsComponent implements OnInit {
  private readonly libraryService = inject(LibraryService);
  private readonly setupService = inject(SetupService);
  private readonly studentService = inject(StudentService);
  private readonly employeeService = inject(EmployeeService);
  private readonly sessionContext = inject(SessionContextService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly BORROWER_TYPE = BORROWER_TYPE;
  readonly BORROWER_TYPE_LABEL = BORROWER_TYPE_LABEL;
  readonly BOOK_ISSUE_STATUS = BOOK_ISSUE_STATUS;
  readonly BOOK_ISSUE_STATUS_LABEL = BOOK_ISSUE_STATUS_LABEL;

  readonly loadingLookups = signal(true);
  readonly loadingIssues = signal(false);
  readonly loadingRoster = signal(false);
  readonly issuing = signal(false);
  readonly showForm = signal(false);

  readonly books = signal<BookListItem[]>([]);
  readonly classSections = signal<ClassWithSectionsDto[]>([]);
  readonly departments = signal<DepartmentResponseDTO[]>([]);
  readonly studentRoster = signal<StudentRosterItem[]>([]);
  readonly employeeRoster = signal<MasterApiResponseDTO[]>([]);

  readonly statusFilter = signal<number | null>(BOOK_ISSUE_STATUS.Issued);
  readonly issues = signal<BookIssueListItem[]>([]);
  readonly displayedColumns = ['book', 'borrower', 'issueDate', 'dueDate', 'status', 'actions'];

  readonly form = this.formBuilder.nonNullable.group({
    borrowerType: [BORROWER_TYPE.Student, Validators.required],
    classSectionId: [null as number | null],
    studentId: [null as number | null],
    departmentId: [null as number | null],
    employeeId: [null as number | null],
    bookId: [null as number | null, Validators.required],
    dueDate: [toLocalDateInput(addDays(new Date(), 14)), Validators.required],
  });

  availableBooks(): BookListItem[] {
    return this.books().filter((book) => book.availableCopies > 0);
  }

  constructor() {
    // Re-loads the student roster whenever the active session changes (e.g.
    // an Admin switches sessions from the topbar while this tab is open) —
    // mirrors the same effect() pattern used by Mark Attendance, since
    // `loadStudentRoster` reads the session live rather than from a snapshot.
    effect(
      () => {
        this.sessionContext.activeSession();
        this.loadStudentRoster(this.form.controls.classSectionId.value);
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    forkJoin({
      books: this.libraryService.getBookCatalog(),
      classSections: this.setupService.getAllClassesWithSections(),
      departments: this.setupService.getAllDepartment(),
      session: this.sessionContext.load(),
    }).subscribe({
      next: (result) => {
        this.books.set(result.books.data ?? []);
        this.classSections.set(result.classSections.data ?? []);
        this.departments.set(result.departments.data ?? []);
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
        this.toast.error('Unable to load library lookups.');
      },
    });

    this.form.controls.borrowerType.valueChanges.subscribe(() => {
      this.form.patchValue({ classSectionId: null, studentId: null, departmentId: null, employeeId: null });
      this.studentRoster.set([]);
      this.employeeRoster.set([]);
    });

    this.form.controls.classSectionId.valueChanges.subscribe((classSectionId) => {
      this.form.patchValue({ studentId: null });
      this.loadStudentRoster(classSectionId);
    });

    this.form.controls.departmentId.valueChanges.subscribe((departmentId) => {
      this.form.patchValue({ employeeId: null });
      this.loadingRoster.set(true);
      this.employeeService.getActiveEmployeeRoster(departmentId).subscribe({
        next: (response) => {
          this.employeeRoster.set(response.data ?? []);
          this.loadingRoster.set(false);
        },
        error: () => {
          this.loadingRoster.set(false);
          this.toast.error('Unable to load the employee roster.');
        },
      });
    });

    this.load();
  }

  private loadStudentRoster(classSectionId: number | null): void {
    this.studentRoster.set([]);
    const activeSessionId = this.sessionContext.activeSession()?.id;
    if (!classSectionId || !activeSessionId) {
      return;
    }
    this.loadingRoster.set(true);
    this.studentService.getStudentRoster(activeSessionId, classSectionId).subscribe({
      next: (response) => {
        this.studentRoster.set(response.data ?? []);
        this.loadingRoster.set(false);
      },
      error: () => {
        this.loadingRoster.set(false);
        this.toast.error('Unable to load the student roster.');
      },
    });
  }

  onFilterChange(status: number | null): void {
    this.statusFilter.set(status);
    this.load();
  }

  private load(): void {
    this.loadingIssues.set(true);
    this.libraryService.getAllIssues(this.statusFilter()).subscribe({
      next: (response) => {
        this.issues.set(response.data ?? []);
        this.loadingIssues.set(false);
      },
      error: () => {
        this.loadingIssues.set(false);
        this.toast.error('Unable to load issued books.');
      },
    });
  }

  openIssueForm(): void {
    this.form.reset({
      borrowerType: BORROWER_TYPE.Student,
      classSectionId: null,
      studentId: null,
      departmentId: null,
      employeeId: null,
      bookId: null,
      dueDate: toLocalDateInput(addDays(new Date(), 14)),
    });
    this.studentRoster.set([]);
    this.employeeRoster.set([]);
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
  }

  issue(): void {
    const value = this.form.getRawValue();
    const borrowerId = value.borrowerType === BORROWER_TYPE.Student ? value.studentId : value.employeeId;
    if (!value.bookId || !borrowerId || !value.dueDate) {
      this.toast.error('Select a borrower, a book, and a due date.');
      return;
    }

    this.issuing.set(true);
    this.libraryService
      .issueBook({ bookId: value.bookId, borrowerType: value.borrowerType, borrowerId, dueDate: value.dueDate })
      .subscribe({
        next: (response) => {
          this.issuing.set(false);
          if (response.isSuccess) {
            this.toast.success('Book issued.');
            this.showForm.set(false);
            this.load();
            this.libraryService.getBookCatalog().subscribe((catalog) => this.books.set(catalog.data ?? []));
          } else {
            this.toast.error(response.errorMessage ?? 'Unable to issue this book.');
          }
        },
        error: () => {
          this.issuing.set(false);
          this.toast.error('Unable to issue this book right now.');
        },
      });
  }

  confirmReturn(row: BookIssueListItem): void {
    this.confirmDialog
      .confirm({ title: 'Return book', message: `Mark "${row.bookTitle}" as returned by ${row.borrowerName}?`, confirmLabel: 'Return' })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.libraryService.returnBook(row.id).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Book returned.');
              this.load();
              this.libraryService.getBookCatalog().subscribe((catalog) => this.books.set(catalog.data ?? []));
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to return this book.');
            }
          },
          error: () => this.toast.error('Unable to return this book right now.'),
        });
      });
  }
}
