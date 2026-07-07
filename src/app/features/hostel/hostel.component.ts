import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { HostelAllocationsComponent } from './hostel-allocations/hostel-allocations.component';
import { HostelRoomsComponent } from './hostel-rooms/hostel-rooms.component';

@Component({
  selector: 'app-hostel',
  standalone: true,
  imports: [HostelAllocationsComponent, HostelRoomsComponent, MatTabsModule],
  templateUrl: './hostel.component.html',
  styleUrl: './hostel.component.scss',
})
export class HostelComponent {}
