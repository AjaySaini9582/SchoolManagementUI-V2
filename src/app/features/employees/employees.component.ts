import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { DataTableRequest, DataTableResponse, ProcessesRequest } from '../../core/models/data-table.model';
import { EmployeeStoreProcedure } from '../../core/models/employee.model';
import { EmployeeService } from '../../core/services/employee.service';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { DataTableColumn } from '../../shared/data-table/data-table.model';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss',
})
export class EmployeesComponent {
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);

  readonly columns: DataTableColumn<EmployeeStoreProcedure>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'mobileNumber', header: 'Mobile Number' },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'qualification', header: 'Qualification' },
    { key: 'assignedClass', header: 'Assigned Class' },
    { key: 'salary', header: 'Salary' },
    { key: 'isActive', header: 'Status', cell: (row) => (row.isActive ? 'Active' : 'Inactive') },
  ];

  readonly fetchEmployees = (
    request: DataTableRequest<ProcessesRequest>,
  ): Observable<DataTableResponse<EmployeeStoreProcedure>> => this.employeeService.getEmployeeList(request);

  openCreate(): void {
    this.router.navigateByUrl('/employees/new');
  }

  openEdit(row: EmployeeStoreProcedure): void {
    this.router.navigateByUrl(`/employees/${row.id}`);
  }
}
