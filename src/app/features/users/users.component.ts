import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';

import { DataTableRequest, DataTableResponse, ProcessesRequest } from '../../core/models/data-table.model';
import { UserGridDTO } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { CredentialsDialogComponent } from '../../shared/credentials-dialog/credentials-dialog.component';
import { DataTableCellDirective } from '../../shared/data-table/data-table-cell.directive';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { DataTableColumn } from '../../shared/data-table/data-table.model';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [DataTableCellDirective, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent {
  private readonly userService = inject(UserService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  readonly columns: DataTableColumn<UserGridDTO>[] = [
    { key: 'userName', header: 'Username', sortable: true },
    { key: 'fullName', header: 'Full Name', sortable: true },
    { key: 'roleName', header: 'Role', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'contactNumber', header: 'Contact' },
    { key: 'isActive', header: 'Status', cell: (row) => (row.isActive ? 'Active' : 'Inactive') },
    { key: 'actions', header: 'Actions', exportable: false },
  ];

  readonly fetchUsers = (request: DataTableRequest<ProcessesRequest>): Observable<DataTableResponse<UserGridDTO>> =>
    this.userService.getUserGrid(request);

  resetPassword(user: UserGridDTO): void {
    this.confirmDialog
      .confirm({
        title: 'Reset password',
        message: `Generate a new password for ${user.fullName ?? user.userName}?`,
        confirmLabel: 'Reset',
      })
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.userService.adminResetUserPassword(user.userId).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Password reset.');
              this.dialog.open(CredentialsDialogComponent, {
                data: {
                  title: 'Password reset',
                  username: user.userName,
                  password: response.data ?? null,
                },
                width: '400px',
              });
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to reset password.');
            }
          },
          error: () => this.toast.error('Unable to reset password right now.'),
        });
      });
  }
}
