import { Routes } from '@angular/router';

import { ROLE } from './core/constants/roles';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, roleGuard, staffGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'not-authorized',
    loadComponent: () => import('./features/not-authorized/not-authorized.component').then((m) => m.NotAuthorizedComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/home-redirect/home-redirect.component').then((m) => m.HomeRedirectComponent),
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'students',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/students/students.component').then((m) => m.StudentsComponent),
      },
      {
        path: 'students/new',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/students/student-form/student-form.component').then((m) => m.StudentFormComponent),
      },
      {
        path: 'students/promote',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/students/promote-students/promote-students.component').then((m) => m.PromoteStudentsComponent),
      },
      {
        path: 'students/bulk-import',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/students/bulk-import-students/bulk-import-students.component').then(
            (m) => m.BulkImportStudentsComponent,
          ),
      },
      {
        path: 'students/id-card',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/students/student-id-card/student-id-card.component').then((m) => m.StudentIdCardComponent),
      },
      {
        path: 'students/bonafide-certificate',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/students/bonafide-certificate/bonafide-certificate.component').then((m) => m.BonafideCertificateComponent),
      },
      {
        path: 'students/transfer-certificate',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/students/transfer-certificate/transfer-certificate.component').then((m) => m.TransferCertificateComponent),
      },
      {
        path: 'students/transfer-certificate/print',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/students/transfer-certificate-print/transfer-certificate-print.component').then(
            (m) => m.TransferCertificatePrintComponent,
          ),
      },
      {
        path: 'students/:id',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/students/student-form/student-form.component').then((m) => m.StudentFormComponent),
      },
      {
        path: 'employees',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/employees/employees.component').then((m) => m.EmployeesComponent),
      },
      {
        path: 'employees/new',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/employees/employee-form/employee-form.component').then((m) => m.EmployeeFormComponent),
      },
      {
        path: 'employees/id-card',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/employees/employee-id-card/employee-id-card.component').then((m) => m.EmployeeIdCardComponent),
      },
      {
        path: 'employees/:id',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/employees/employee-form/employee-form.component').then((m) => m.EmployeeFormComponent),
      },
      {
        path: 'attendance',
        canActivate: [roleGuard(ROLE.Admin, ROLE.Teacher)],
        loadComponent: () => import('./features/attendance/attendance.component').then((m) => m.AttendanceComponent),
      },
      {
        path: 'fee',
        loadChildren: () => import('./features/fee/fee.routes').then((m) => m.FEE_ROUTES),
      },
      {
        path: 'exam',
        canActivate: [roleGuard(ROLE.Admin, ROLE.Teacher)],
        loadComponent: () => import('./features/exam/exam.component').then((m) => m.ExamComponent),
      },
      {
        path: 'exam/report-card',
        canActivate: [roleGuard(ROLE.Admin, ROLE.Teacher)],
        loadComponent: () => import('./features/exam/report-card/report-card.component').then((m) => m.ReportCardComponent),
      },
      {
        path: 'transport',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/transport/transport.component').then((m) => m.TransportComponent),
      },
      {
        path: 'setup',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/setup/setup.component').then((m) => m.SetupComponent),
      },
      {
        path: 'school-profile',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/school-profile/school-profile.component').then((m) => m.SchoolProfileComponent),
      },
      {
        path: 'admission',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admission/admission.component').then((m) => m.AdmissionComponent),
      },
      {
        path: 'admission/new',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admission/admission-form/admission-form.component').then((m) => m.AdmissionFormComponent),
      },
      {
        path: 'admission/:id',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admission/admission-form/admission-form.component').then((m) => m.AdmissionFormComponent),
      },
      {
        path: 'notice-board',
        loadComponent: () => import('./features/notice-board/notice-board.component').then((m) => m.NoticeBoardComponent),
      },
      {
        path: 'homework',
        canActivate: [roleGuard(ROLE.Admin, ROLE.Teacher)],
        loadComponent: () => import('./features/homework/homework.component').then((m) => m.HomeworkComponent),
      },
      {
        path: 'my-homework',
        canActivate: [roleGuard(ROLE.Student)],
        loadComponent: () => import('./features/homework/my-homework/my-homework.component').then((m) => m.MyHomeworkComponent),
      },
      {
        path: 'timetable',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/timetable/timetable.component').then((m) => m.TimetableComponent),
      },
      {
        path: 'my-timetable',
        canActivate: [roleGuard(ROLE.Student)],
        loadComponent: () => import('./features/timetable/my-timetable/my-timetable.component').then((m) => m.MyTimetableComponent),
      },
      {
        path: 'document-verification',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/document-verification/document-verification.component').then((m) => m.DocumentVerificationComponent),
      },
      {
        path: 'activity-log',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/activity-log/activity-log.component').then((m) => m.ActivityLogComponent),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'my-record',
        canActivate: [roleGuard(ROLE.Student)],
        loadComponent: () => import('./features/placeholder/feature-placeholder.component').then((m) => m.FeaturePlaceholderComponent),
        data: { title: 'My Record' },
      },
      {
        path: 'my-report-card',
        canActivate: [roleGuard(ROLE.Student)],
        loadComponent: () => import('./features/placeholder/feature-placeholder.component').then((m) => m.FeaturePlaceholderComponent),
        data: { title: 'Report Card' },
      },
      {
        path: 'my-fee-due',
        canActivate: [roleGuard(ROLE.Student)],
        loadComponent: () => import('./features/placeholder/feature-placeholder.component').then((m) => m.FeaturePlaceholderComponent),
        data: { title: 'Fee Due' },
      },
      {
        path: 'staff-attendance',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/staff-attendance/staff-attendance.component').then((m) => m.StaffAttendanceComponent),
      },
      {
        path: 'my-leave',
        canActivate: [staffGuard],
        loadComponent: () => import('./features/my-leave/my-leave.component').then((m) => m.MyLeaveComponent),
      },
      {
        path: 'leave-approval',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/leave-approval/leave-approval.component').then((m) => m.LeaveApprovalComponent),
      },
      {
        path: 'payroll',
        canActivate: [roleGuard(ROLE.Admin, ROLE.Accountant)],
        loadComponent: () => import('./features/payroll/payroll.component').then((m) => m.PayrollComponent),
      },
      {
        path: 'payroll/payslip',
        canActivate: [staffGuard],
        loadComponent: () =>
          import('./features/payroll/payslip-print/payslip-print.component').then((m) => m.PayslipPrintComponent),
      },
      {
        path: 'my-payslips',
        canActivate: [staffGuard],
        loadComponent: () =>
          import('./features/payroll/my-payslips/my-payslips.component').then((m) => m.MyPayslipsComponent),
      },
      {
        path: 'library',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/library/library.component').then((m) => m.LibraryComponent),
      },
      {
        path: 'my-books',
        canActivate: [roleGuard(ROLE.Admin, ROLE.Teacher, ROLE.Accountant, ROLE.Employee, ROLE.Student)],
        loadComponent: () => import('./features/library/my-books/my-books.component').then((m) => m.MyBooksComponent),
      },
      {
        path: 'hostel',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/hostel/hostel.component').then((m) => m.HostelComponent),
      },
      {
        path: 'my-room',
        canActivate: [roleGuard(ROLE.Admin, ROLE.Student)],
        loadComponent: () => import('./features/hostel/my-room/my-room.component').then((m) => m.MyRoomComponent),
      },
      {
        path: 'inventory',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/inventory/inventory.component').then((m) => m.InventoryComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
