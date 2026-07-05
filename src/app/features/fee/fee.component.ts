import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { CollectFeeComponent } from './collect-fee/collect-fee.component';
import { CollectionReportComponent } from './collection-report/collection-report.component';

@Component({
  selector: 'app-fee',
  standalone: true,
  imports: [CollectFeeComponent, CollectionReportComponent, MatTabsModule],
  templateUrl: './fee.component.html',
  styleUrl: './fee.component.scss',
})
export class FeeComponent {}
