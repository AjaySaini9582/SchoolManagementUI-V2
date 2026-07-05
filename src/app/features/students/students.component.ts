import { Component, ViewChild, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { DataTableRequest, DataTableResponse, ProcessesRequest } from '../../core/models/data-table.model';
import { StudentStoreProcedure } from '../../core/models/student.model';
import { SessionContextService } from '../../core/services/session-context.service';
import { StudentService } from '../../core/services/student.service';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { DataTableColumn } from '../../shared/data-table/data-table.model';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss',
})
export class StudentsComponent {
  private readonly studentService = inject(StudentService);
  private readonly router = inject(Router);
  private readonly sessionContext = inject(SessionContextService);

  // `GetStudentList` resolves the active session server-side (see
  // project_school_management_getstudentlist_fix) — without this, switching
  // sessions from the topbar left this grid showing the old session's data
  // until the user navigated away and back.
  @ViewChild(DataTableComponent) private readonly dataTable?: DataTableComponent<StudentStoreProcedure>;

  constructor() {
    effect(
      () => {
        this.sessionContext.activeSession();
        this.dataTable?.reload();
      },
      { allowSignalWrites: true },
    );
  }

  readonly columns: DataTableColumn<StudentStoreProcedure>[] = [
    { key: 'studentName', header: 'Name', sortable: true },
    { key: 'fatherName', header: "Father's Name", sortable: true },
    { key: 'className', header: 'Class', sortable: true },
    { key: 'sectionName', header: 'Section' },
    { key: 'gender', header: 'Gender' },
    { key: 'rollNumber', header: 'Roll No.' },
    { key: 'srnNumber', header: 'SRN' },
    { key: 'status', header: 'Status', cell: (row) => (row.status ? 'Active' : 'Inactive') },
  ];

  readonly fetchStudents = (
    request: DataTableRequest<ProcessesRequest>,
  ): Observable<DataTableResponse<StudentStoreProcedure>> => this.studentService.getStudentList(request);

  openCreate(): void {
    this.router.navigateByUrl('/students/new');
  }

  openPromote(): void {
    this.router.navigateByUrl('/students/promote');
  }

  openBulkImport(): void {
    this.router.navigateByUrl('/students/bulk-import');
  }

  openEdit(row: StudentStoreProcedure): void {
    this.router.navigateByUrl(`/students/${row.id}`);
  }
}
