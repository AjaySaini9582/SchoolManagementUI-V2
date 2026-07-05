import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

/** Shared HttpClient plumbing (URL building, query params) for the one
 * service-per-controller layer, so each service only lists its endpoints. */
export abstract class ApiBaseService {
  protected readonly http = inject(HttpClient);

  protected abstract readonly controllerName: string;

  private buildUrl(action: string): string {
    return `${environment.apiBaseUrl}/api/${this.controllerName}/${action}`;
  }

  private buildParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        continue;
      }
      if (Array.isArray(value)) {
        // ASP.NET Core's default [FromQuery] List<T> binding expects the
        // same key repeated (?KeyList=1&KeyList=2), not a comma-joined value.
        for (const item of value) {
          httpParams = httpParams.append(key, String(item));
        }
      } else {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }

  protected get<T>(action: string, params?: Record<string, unknown>): Observable<T> {
    return this.http.get<T>(this.buildUrl(action), { params: this.buildParams(params) });
  }

  protected post<T>(action: string, body?: unknown, params?: Record<string, unknown>): Observable<T> {
    return this.http.post<T>(this.buildUrl(action), body ?? {}, { params: this.buildParams(params) });
  }

  protected postForm<T>(action: string, formData: FormData): Observable<T> {
    return this.http.post<T>(this.buildUrl(action), formData);
  }
}
