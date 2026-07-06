import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SCHOOL_DOCUMENT_NAME, SchoolProfile } from '../models/school.model';
import { SchoolService } from './school.service';

/** Caches the school profile (`GetSchoolData`) so the shell (topbar/sidebar/
 * document title) reads it from here instead of each re-fetching it —
 * mirrors `SessionContextService`. Loaded lazily after login (the backend
 * endpoint requires auth), not at app bootstrap. */
@Injectable({ providedIn: 'root' })
export class SchoolProfileContextService {
  private readonly schoolService = inject(SchoolService);

  private readonly schoolProfileSignal = signal<SchoolProfile | null>(null);
  private readonly logoUrlSignal = signal<string | null>(null);
  private loaded = false;

  readonly schoolProfile = this.schoolProfileSignal.asReadonly();
  readonly logoUrl = this.logoUrlSignal.asReadonly();

  load(): Observable<SchoolProfile | null> {
    if (this.loaded) {
      return of(this.schoolProfileSignal());
    }
    return forkJoin({
      profile: this.schoolService.getSchoolData(),
      documentTypes: this.schoolService.getAllSchoolDocumentMasterList(),
    }).pipe(
      map(({ profile, documentTypes }) => {
        const data = profile.data;
        const logoMasterId = documentTypes.data?.find((doc) => doc.documentName === SCHOOL_DOCUMENT_NAME.Logo)?.id ?? null;
        const logoDoc = data?.uploadDocumentDTO?.find((doc) => doc.schoolDocumentMasterId === logoMasterId) ?? null;
        this.logoUrlSignal.set(
          data && logoDoc?.fileName ? `${environment.apiBaseUrl}/UploadFiles/School/${data.id}/${logoDoc.fileName}` : null,
        );
        return data;
      }),
      tap((profile) => {
        this.schoolProfileSignal.set(profile);
        this.loaded = true;
      }),
    );
  }

  /** Forces the next `load()` to re-fetch — call after saving the School
   * Profile form so the shell picks up the change immediately. */
  refresh(): void {
    this.loaded = false;
    this.load().subscribe();
  }
}
