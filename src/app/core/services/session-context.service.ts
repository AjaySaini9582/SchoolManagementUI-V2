import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';

import { SessionResponseDTO } from '../models/setup.model';
import { SetupService } from './setup.service';

/** Caches the active school-year session (`GetActiveSession`) so feature
 * components read it from here instead of each re-fetching it. Loaded lazily
 * by the shell on first render after login, not at app bootstrap — the
 * backend endpoint requires auth, which doesn't exist yet at bootstrap time. */
@Injectable({ providedIn: 'root' })
export class SessionContextService {
  private readonly setupService = inject(SetupService);

  private readonly activeSessionSignal = signal<SessionResponseDTO | null>(null);
  private loaded = false;

  readonly activeSession = this.activeSessionSignal.asReadonly();

  load(): Observable<SessionResponseDTO | null> {
    if (this.loaded) {
      return of(this.activeSessionSignal());
    }
    return this.setupService.getActiveSession().pipe(
      map((response) => response.data),
      tap((session) => {
        this.activeSessionSignal.set(session);
        this.loaded = true;
      }),
    );
  }

  setActiveSession(session: SessionResponseDTO): void {
    this.activeSessionSignal.set(session);
  }

  reset(): void {
    this.activeSessionSignal.set(null);
    this.loaded = false;
  }
}
