import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { AssignTransportComponent } from './assign-transport/assign-transport.component';
import { RouteSummaryComponent } from './route-summary/route-summary.component';
import { TransportRosterComponent } from './transport-roster/transport-roster.component';

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [AssignTransportComponent, MatTabsModule, RouteSummaryComponent, TransportRosterComponent],
  templateUrl: './transport.component.html',
  styleUrl: './transport.component.scss',
})
export class TransportComponent {}
