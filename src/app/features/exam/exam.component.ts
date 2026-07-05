import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { MarksEntryComponent } from './marks-entry/marks-entry.component';
import { ReportCardLookupComponent } from './report-card-lookup/report-card-lookup.component';

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [MarksEntryComponent, MatTabsModule, ReportCardLookupComponent],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.scss',
})
export class ExamComponent {}
