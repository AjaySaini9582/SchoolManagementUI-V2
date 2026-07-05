export interface UserGridDTO {
  userId: number;
  userName: string | null;
  fullName: string | null;
  roleId: number;
  roleName: string | null;
  contactNumber: string | null;
  email: string | null;
  isActive: boolean;
  isPasswordChanged: boolean;
}

export interface UserStoreProcedure {
  userId: number;
  userName: string | null;
  fullName: string | null;
  roleName: string | null;
  contactNumber: string | null;
  email: string | null;
  isActive: boolean;
  password: string | null;
  totalCount: number;
}
