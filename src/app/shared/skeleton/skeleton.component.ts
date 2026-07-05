import { Component, Input } from '@angular/core';

/** Shimmering placeholder block for loading states —
 * `<app-skeleton width="60%" height="1.25rem" />` — so lists/cards show a
 * shape of what's coming instead of a blank screen or a bare spinner. */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: '',
  host: {
    '[style.width]': 'width',
    '[style.height]': 'height',
    '[style.border-radius]': 'circle ? "50%" : null',
  },
  styles: `
    :host {
      display: block;
      border-radius: 4px;
      background: linear-gradient(90deg, rgba(0, 0, 0, 0.06) 25%, rgba(0, 0, 0, 0.12) 37%, rgba(0, 0, 0, 0.06) 63%);
      background-size: 400% 100%;
      animation: app-skeleton-shimmer 1.4s ease infinite;
    }

    @keyframes app-skeleton-shimmer {
      0% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0 50%;
      }
    }
  `,
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() circle = false;
}
