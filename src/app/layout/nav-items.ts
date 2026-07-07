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
  { label: 'Admission', icon: 'assignment_ind', path: '/admission', roles: [ROLE.Admin] },
  { label: 'Students', icon: 'school', path: '/students', roles: [ROLE.Admin] },
  { label: 'Employees', icon: 'badge', path: '/employees', roles: [ROLE.Admin] },
  { label: 'Attendance', icon: 'fact_check', path: '/attendance', roles: [ROLE.Admin, ROLE.Teacher] },
  { label: 'Fee', icon: 'payments', path: '/fee', roles: [ROLE.Admin, ROLE.Accountant] },
  { label: 'Exam', icon: 'quiz', path: '/exam', roles: [ROLE.Admin, ROLE.Teacher] },
  { label: 'Transport', icon: 'directions_bus', path: '/transport', roles: [ROLE.Admin] },
  { label: 'Homework', icon: 'menu_book', path: '/homework', roles: [ROLE.Admin, ROLE.Teacher] },
  { label: 'Timetable', icon: 'calendar_month', path: '/timetable', roles: [ROLE.Admin] },
  {
    label: 'Notice Board',
    icon: 'campaign',
    path: '/notice-board',
    roles: [ROLE.Admin, ROLE.Teacher, ROLE.Accountant, ROLE.Employee, ROLE.Student],
  },
  { label: 'Setup', icon: 'tune', path: '/setup', roles: [ROLE.Admin] },
  { label: 'School Profile', icon: 'domain', path: '/school-profile', roles: [ROLE.Admin] },
  { label: 'Document Verification', icon: 'verified', path: '/document-verification', roles: [ROLE.Admin] },
  { label: 'Activity Log', icon: 'history', path: '/activity-log', roles: [ROLE.Admin] },
  { label: 'Users', icon: 'manage_accounts', path: '/users', roles: [ROLE.Admin] },
  { label: 'Staff Attendance', icon: 'how_to_reg', path: '/staff-attendance', roles: [ROLE.Admin] },
  { label: 'Leave Approval', icon: 'fact_check', path: '/leave-approval', roles: [ROLE.Admin] },
  { label: 'Payroll', icon: 'account_balance_wallet', path: '/payroll', roles: [ROLE.Admin, ROLE.Accountant] },
  {
    label: 'My Leave',
    icon: 'event_available',
    path: '/my-leave',
    roles: [ROLE.Admin, ROLE.Teacher, ROLE.Accountant, ROLE.Employee],
  },
  {
    label: 'My Payslips',
    icon: 'payments',
    path: '/my-payslips',
    roles: [ROLE.Admin, ROLE.Teacher, ROLE.Accountant, ROLE.Employee],
  },
  { label: 'Library', icon: 'menu_book', path: '/library', roles: [ROLE.Admin] },
  {
    label: 'My Books',
    icon: 'import_contacts',
    path: '/my-books',
    roles: [ROLE.Admin, ROLE.Teacher, ROLE.Accountant, ROLE.Employee, ROLE.Student],
  },
  { label: 'Hostel', icon: 'bed', path: '/hostel', roles: [ROLE.Admin] },
  { label: 'My Room', icon: 'bed', path: '/my-room', roles: [ROLE.Student] },
  { label: 'Inventory', icon: 'inventory_2', path: '/inventory', roles: [ROLE.Admin] },
  { label: 'My Record', icon: 'person', path: '/my-record', roles: [ROLE.Student] },
  { label: 'My Homework', icon: 'menu_book', path: '/my-homework', roles: [ROLE.Student] },
  { label: 'My Timetable', icon: 'calendar_month', path: '/my-timetable', roles: [ROLE.Student] },
  { label: 'Report Card', icon: 'grading', path: '/my-report-card', roles: [ROLE.Student] },
  { label: 'Fee Due', icon: 'account_balance_wallet', path: '/my-fee-due', roles: [ROLE.Student] },
];
