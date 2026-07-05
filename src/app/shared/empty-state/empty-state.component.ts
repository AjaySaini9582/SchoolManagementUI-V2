import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Consistent "nothing here" placeholder for list/grid views —
 * `<app-empty-state icon="inbox" title="No students yet" />` — instead of
 * every feature writing its own blank-state text. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-state-icon">{{ icon }}</mat-icon>
      <p class="empty-state-title">{{ title }}</p>
      @if (description) {
        <p class="empty-state-description">{{ description }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 2.5rem 1rem;
      text-align: center;
      opacity: 0.75;
    }

    .empty-state-icon {
      width: 40px;
      height: 40px;
      font-size: 40px;
      opacity: 0.5;
    }

    .empty-state-title {
      margin: 0;
      font-weight: 500;
    }

    .empty-state-description {
      margin: 0;
      font-size: 0.85rem;
    }
  `,
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nothing here yet';
  @Input() description = '';
}
