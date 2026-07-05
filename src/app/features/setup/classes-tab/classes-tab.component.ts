import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

import { ClassWithSectionsDto } from '../../../core/models/setup.model';
import { SetupService } from '../../../core/services/setup.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { ToastService } from '../../../shared/toast/toast.service';
import { MasterItemDialogComponent, MasterItemDialogResult } from '../master-item-dialog/master-item-dialog.component';

@Component({
  selector: 'app-classes-tab',
  standalone: true,
  imports: [EmptyStateComponent, MatButtonModule, MatChipsModule, MatExpansionModule, MatIconModule, SkeletonComponent],
  templateUrl: './classes-tab.component.html',
  styleUrl: './classes-tab.component.scss',
})
export class ClassesTabComponent implements OnInit {
  private readonly setupService = inject(SetupService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly classes = signal<ClassWithSectionsDto[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.setupService.getAllClassesWithSections().subscribe({
      next: (response) => {
        this.classes.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load classes.');
      },
    });
  }

  openCreate(): void {
    this.openDialog(null);
  }

  openEdit(cls: ClassWithSectionsDto): void {
    this.openDialog({ id: cls.id, name: cls.name });
  }

  addSection(cls: ClassWithSectionsDto): void {
    this.setupService.addSectionToClass({ classId: cls.id }).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success(`Section added to ${cls.name}.`);
          this.load();
        } else {
          this.toast.error(response.errorMessage ?? 'Unable to add section.');
        }
      },
      error: () => this.toast.error('Unable to add section right now.'),
    });
  }

  private openDialog(item: { id: number; name: string } | null): void {
    this.dialog
      .open(MasterItemDialogComponent, { data: { label: 'Class', item }, width: '360px' })
      .afterClosed()
      .subscribe((result: MasterItemDialogResult | undefined) => {
        if (!result) {
          return;
        }
        this.setupService.createOrUpdateClass(result).subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.toast.success('Class saved.');
              this.load();
            } else {
              this.toast.error(response.errorMessage ?? 'Unable to save class.');
            }
          },
          error: () => this.toast.error('Unable to save class right now.'),
        });
      });
  }
}
