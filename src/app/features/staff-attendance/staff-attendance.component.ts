import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { MarkStaffAttendanceComponent } from './mark-staff-attendance/mark-staff-attendance.component';
import { StaffMonthlyRegisterComponent } from './staff-monthly-register/staff-monthly-register.component';

@Component({
  selector: 'app-staff-attendance',
  standalone: true,
  imports: [MarkStaffAttendanceComponent, MatTabsModule, StaffMonthlyRegisterComponent],
  templateUrl: './staff-attendance.component.html',
  styleUrl: './staff-attendance.component.scss',
})
export class StaffAttendanceComponent {}
