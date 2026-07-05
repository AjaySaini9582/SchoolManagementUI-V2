import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AuthenticatedUser, AuthenticateResult, JwtPayload } from '../models/auth.model';
import { BaseResponse } from '../models/base-response.model';
import { decodeJwtPayload } from '../utils/jwt.util';
import { ApiBaseService } from './api-base.service';
import { SessionContextService } from './session-context.service';

const TOKEN_STORAGE_KEY = 'srs_auth_token';

/** Login/reset-password live on `UserController` in the backend, so this
 * shares the same controller route as `UserService` but only the
 * `[AllowAnonymous]` actions — plus the client-side session state (token
 * storage, decoded current user) that those actions feed. Token is kept in
 * `sessionStorage`, not `localStorage`, to limit the XSS exposure window and
 * clear automatically when the tab closes. */
@Injectable({ providedIn: 'root' })
export class AuthService extends ApiBaseService {
  protected readonly controllerName = 'User';

  private readonly sessionContext = inject(SessionContextService);
  private readonly tokenSignal = signal<string | null>(sessionStorage.getItem(TOKEN_STORAGE_KEY));

  readonly currentUser = computed<AuthenticatedUser | null>(() => this.parseUser(this.tokenSignal()));
  readonly isAuthenticated = computed<boolean>(() => this.currentUser() !== null);

  authenticate(userName: string, password: string, roleId: number): Observable<AuthenticateResult> {
    return this.get('Authenticate', { UserName: userName, Password: password, RoleId: roleId });
  }

  resetPassword(userName: string): Observable<BaseResponse> {
    return this.get('ResetPassword', { UserName: userName });
  }

  login(userName: string, password: string, roleId: number): Observable<AuthenticateResult> {
    return this.authenticate(userName, password, roleId).pipe(
      tap((result) => {
        if (result.status === 'Success' && result.result.jwtToken) {
          this.setToken(result.result.jwtToken);
        }
      }),
    );
  }

  logout(): void {
    this.setToken(null);
    this.sessionContext.reset();
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  hasAnyRole(...roles: string[]): boolean {
    const user = this.currentUser();
    return user !== null && roles.includes(user.roleName);
  }

  private setToken(token: string | null): void {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    this.tokenSignal.set(token);
  }

  private parseUser(token: string | null): AuthenticatedUser | null {
    if (!token) {
      return null;
    }
    const payload = decodeJwtPayload<JwtPayload>(token);
    if (!payload || payload.exp * 1000 <= Date.now()) {
      return null;
    }
    return {
      userId: Number(payload.UserId),
      userName: payload.UserName,
      roleId: Number(payload.RoleId),
      roleName: payload.RoleName,
    };
  }
}
