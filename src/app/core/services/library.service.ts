import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseRequest, BaseResponse } from '../models/base-response.model';
import { Book, BookIssueListItem, BookListItem, IssueBookRequest } from '../models/library.model';
import { DeactiveRequest } from '../models/shared.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class LibraryService extends ApiBaseService {
  protected readonly controllerName = 'Library';

  getBookCatalog(): Observable<BaseResponse<BookListItem[]>> {
    return this.get('GetBookCatalog');
  }

  createOrUpdateBook(book: Book): Observable<BaseResponse<boolean>> {
    return this.post('CreateOrUpdateBook', { data: book } satisfies BaseRequest<Book>);
  }

  deactivateBook(id: number): Observable<BaseResponse<boolean>> {
    return this.post('DeactivateBook', { data: { id } } satisfies BaseRequest<DeactiveRequest>);
  }

  issueBook(request: IssueBookRequest): Observable<BaseResponse<boolean>> {
    return this.post('IssueBook', { data: request } satisfies BaseRequest<IssueBookRequest>);
  }

  returnBook(issueId: number): Observable<BaseResponse<boolean>> {
    return this.post('ReturnBook', { data: { id: issueId } } satisfies BaseRequest<DeactiveRequest>);
  }

  getAllIssues(status: number | null): Observable<BaseResponse<BookIssueListItem[]>> {
    return this.get('GetAllIssues', { status });
  }

  getMyIssuedBooks(): Observable<BaseResponse<BookIssueListItem[]>> {
    return this.get('GetMyIssuedBooks');
  }
}
