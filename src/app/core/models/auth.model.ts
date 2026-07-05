export interface TokenResponse {
  isUserFound: number;
  jwtToken: string | null;
  message: string | null;
  fullName: string | null;
  roleId: number;
  userId: number;
  roleName: string | null;
  isPasswordChanged: boolean;
}

/** `UserController.Authenticate` returns this raw shape directly (not
 * wrapped in `BaseResponse<T>`). */
export interface AuthenticateResult {
  status: 'Success' | 'Failed';
  result: TokenResponse;
}

/** Claims as they appear in the decoded JWT payload (custom claim names,
 * exactly as `UserController.Authenticate` writes them — see the
 * `new Claim("UserName", ...)` etc. in the backend). */
export interface JwtPayload {
  UserName: string;
  UserId: string;
  RoleId: string;
  RoleName: string;
  exp: number;
}

/** App-facing, normalized shape derived from the decoded token. */
export interface AuthenticatedUser {
  userId: number;
  userName: string;
  roleId: number;
  roleName: string;
}
