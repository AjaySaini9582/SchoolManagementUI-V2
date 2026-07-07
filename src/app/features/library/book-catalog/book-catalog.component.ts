import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { Book, BookListItem } from '../../../core/models/library.model';
import { LibraryService } from '../../../core/services/library.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-book-catalog',
  standalone: true,
  imports: [
    EmptyStateComponent,
    FieldErrorComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  templateUrl: './book-catalog.component.html',
  styleUrl: './book-catalog.component.scss',
})
export class BookCatalogComponent implements OnInit {
  private readonly libraryService = inject(LibraryService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly books = signal<BookListItem[]>([]);
  readonly displayedColumns = ['title', 'author', 'category', 'copies', 'actions'];

  readonly form = this.formBuilder.nonNullable.group({
    title: ['', Validators.required],
    author: [''],
    isbn: [''],
    category: [''],
    publisher: [''],
    totalCopies: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.libraryService.getBookCatalog().subscribe({
      next: (response) => {
        this.books.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load the book catalog.');
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ title: '', author: '', isbn: '', category: '', publisher: '', totalCopies: 1 });
    this.showForm.set(true);
  }

  openEdit(row: BookListItem): void {
    this.editingId.set(row.id);
    this.form.reset({
      title: row.title ?? '',
      author: row.author ?? '',
      isbn: row.isbn ?? '',
      category: row.category ?? '',
      publisher: row.publisher ?? '',
      totalCopies: row.totalCopies,
    });
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const book: Book = {
      id: this.editingId() ?? 0,
      title: value.title,
      author: value.author || null,
      isbn: value.isbn || null,
      category: value.category || null,
      publisher: value.publisher || null,
      totalCopies: value.totalCopies,
      isActive: true,
    };

    this.saving.set(true);
    this.libraryService.createOrUpdateBook(book).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.isSuccess) {
          this.toast.success('Book saved.');
          this.showForm.set(false);
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to save this book.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Unable to save this book right now.');
      },
    });
  }

  confirmDeactivate(row: BookListItem): void {
    this.confirmDialog
      .confirm({ title: 'Remove book', message: `Remove "${row.title}" from the catalog?`, confirmLabel: 'Remove', danger: true })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.libraryService.deactivateBook(row.id).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Book removed.');
              this.load();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to remove this book.');
            }
          },
          error: () => this.toast.error('Unable to remove this book right now.'),
        });
      });
  }
}
