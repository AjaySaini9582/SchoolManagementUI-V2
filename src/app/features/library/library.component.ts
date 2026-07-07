import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { BookCatalogComponent } from './book-catalog/book-catalog.component';
import { IssueReturnsComponent } from './issue-returns/issue-returns.component';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [BookCatalogComponent, IssueReturnsComponent, MatTabsModule],
  templateUrl: './library.component.html',
  styleUrl: './library.component.scss',
})
export class LibraryComponent {}
