import { ROLE, RoleName } from '../core/constants/roles';

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles: RoleName[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard',
    // Matches DashboardController's server-side [AuthorizeRoles(...)] set exactly.
    roles: [ROLE.Admin, ROLE.Teacher, ROLE.Accountant, ROLE.Employee],
  },
  { label: 'Students', icon: 'school', path: '/students', roles: [ROLE.Admin] },
  { label: 'Employees', icon: 'badge', path: '/employees', roles: [ROLE.Admin] },
  { label: 'Attendance', icon: 'fact_check', path: '/attendance', roles: [ROLE.Admin, ROLE.Teacher] },
  { label: 'Fee', icon: 'payments', path: '/fee', roles: [ROLE.Admin, ROLE.Accountant] },
  { label: 'Exam', icon: 'quiz', path: '/exam', roles: [ROLE.Admin, ROLE.Teacher] },
  { label: 'Transport', icon: 'directions_bus', path: '/transport', roles: [ROLE.Admin] },
  { label: 'Setup', icon: 'tune', path: '/setup', roles: [ROLE.Admin] },
  { label: 'Document Verification', icon: 'verified', path: '/document-verification', roles: [ROLE.Admin] },
  { label: 'Activity Log', icon: 'history', path: '/activity-log', roles: [ROLE.Admin] },
  { label: 'Users', icon: 'manage_accounts', path: '/users', roles: [ROLE.Admin] },
  { label: 'My Record', icon: 'person', path: '/my-record', roles: [ROLE.Student] },
  { label: 'Report Card', icon: 'grading', path: '/my-report-card', roles: [ROLE.Student] },
  { label: 'Fee Due', icon: 'account_balance_wallet', path: '/my-fee-due', roles: [ROLE.Student] },
];
