import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { MarkAttendanceComponent } from './mark-attendance/mark-attendance.component';
import { MonthlyRegisterComponent } from './monthly-register/monthly-register.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [MarkAttendanceComponent, MatTabsModule, MonthlyRegisterComponent],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss',
})
export class AttendanceComponent {}
