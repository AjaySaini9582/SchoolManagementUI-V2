import { Component, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { MasterItemDialogResult } from './master-item-dialog/master-item-dialog.component';
import { MasterListContainerComponent } from './master-list-container/master-list-container.component';
import { AssignSubjectsTabComponent } from './assign-subjects-tab/assign-subjects-tab.component';
import { BusStoppagesTabComponent } from './bus-stoppages-tab/bus-stoppages-tab.component';
import { ClassesTabComponent } from './classes-tab/classes-tab.component';
import { ExamTypesTabComponent } from './exam-types-tab/exam-types-tab.component';
import { HousesTabComponent } from './houses-tab/houses-tab.component';
import { PayModesTabComponent } from './pay-modes-tab/pay-modes-tab.component';
import { SessionsTabComponent } from './sessions-tab/sessions-tab.component';
import { SetupService } from '../../core/services/setup.service';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [
    AssignSubjectsTabComponent,
    BusStoppagesTabComponent,
    ClassesTabComponent,
    ExamTypesTabComponent,
    HousesTabComponent,
    MasterListContainerComponent,
    MatTabsModule,
    PayModesTabComponent,
    SessionsTabComponent,
  ],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss',
})
export class SetupComponent {
  private readonly setupService = inject(SetupService);

  readonly fetchDepartments = () => this.setupService.getAllDepartment();
  readonly saveDepartment = (item: MasterItemDialogResult) => this.setupService.createOrUpdateDepartment(item);
  readonly deactivateDepartment = (id: number) => this.setupService.deactiveDepartmentById(id);

  readonly fetchDesignations = () => this.setupService.getAllDesignation();
  readonly saveDesignation = (item: MasterItemDialogResult) => this.setupService.createOrUpdateDesignation(item);
  readonly deactivateDesignation = (id: number) => this.setupService.deactiveDesignationById(id);

  readonly fetchSubjects = () => this.setupService.getAllSubject();
  readonly saveSubject = (item: MasterItemDialogResult) => this.setupService.createOrUpdateSubject({ ...item, isActive: true });
  readonly deactivateSubject = (id: number) => this.setupService.deactiveSubjectById(id);

  readonly fetchBusRoutes = () => this.setupService.getAllBusRoutes();
  readonly saveBusRoute = (item: MasterItemDialogResult) => this.setupService.createOrUpdateBusRoute({ ...item, isActive: true });
  readonly deactivateBusRoute = (id: number) => this.setupService.deactiveBusRouteById(id);
}
