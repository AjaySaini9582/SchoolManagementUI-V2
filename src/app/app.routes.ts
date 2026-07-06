import { Routes } from '@angular/router';

import { ROLE } from './core/constants/roles';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, roleGuard } from './core/guards/role.guard';

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
    ],
  },
  { path: '**', redirectTo: 'login' },
];
