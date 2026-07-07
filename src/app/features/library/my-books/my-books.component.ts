import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { BOOK_ISSUE_STATUS, BOOK_ISSUE_STATUS_LABEL, BookIssueListItem } from '../../../core/models/library.model';
import { LibraryService } from '../../../core/services/library.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-my-books',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent, SkeletonComponent],
  templateUrl: './my-books.component.html',
  styleUrl: './my-books.component.scss',
})
export class MyBooksComponent implements OnInit {
  private readonly libraryService = inject(LibraryService);
  private readonly toast = inject(ToastService);

  readonly BOOK_ISSUE_STATUS = BOOK_ISSUE_STATUS;
  readonly BOOK_ISSUE_STATUS_LABEL = BOOK_ISSUE_STATUS_LABEL;

  readonly loading = signal(true);
  readonly issues = signal<BookIssueListItem[]>([]);

  ngOnInit(): void {
    this.libraryService.getMyIssuedBooks().subscribe({
      next: (response) => {
        this.issues.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load your issued books.');
      },
    });
  }
}
