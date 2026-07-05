export const ROLE = {
  Admin: 'Admin',
  Employee: 'Employee',
  Student: 'Student',
  Teacher: 'Teacher',
  Accountant: 'Accountant',
} as const;

export type RoleName = (typeof ROLE)[keyof typeof ROLE];

export interface LoginRoleOption {
  roleId: number;
  roleName: RoleName;
}

/** There's no anonymous role-lookup endpoint (`MasterController.GetAllRoleTypeMaster`
 * requires a JWT, which the login form doesn't have yet), so this mirrors the
 * fixed Ids seeded by `SRS.Dal/Migrations/20260704092357_SeedRolesAndSystemAdmin.cs`
 * and `20260704101424_SecurePasswordFlowAndRoles.cs` (table `usr.Tb_Roles`).
 * If that seed data ever changes, this list must be updated to match. */
export const LOGIN_ROLE_OPTIONS: LoginRoleOption[] = [
  { roleId: 1, roleName: ROLE.Admin },
  { roleId: 2, roleName: ROLE.Employee },
  { roleId: 3, roleName: ROLE.Student },
  { roleId: 4, roleName: ROLE.Teacher },
  { roleId: 5, roleName: ROLE.Accountant },
];
