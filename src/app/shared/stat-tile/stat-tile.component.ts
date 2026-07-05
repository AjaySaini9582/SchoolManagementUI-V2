import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type StatTileAccent = 'primary' | 'success' | 'warning' | 'danger';

const ACCENT_CLASSES: Record<StatTileAccent, string> = {
  primary: 'bg-violet-50 text-violet-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
};

/** Small dashboard number card — enrollment, fee collected, attendance %,
 * staff count, etc. Tailwind-laid-out shell around a Material icon. */
@Component({
  selector: 'app-stat-tile',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="flex items-center gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" [class]="accentClass">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <div class="min-w-0">
        <p class="m-0 truncate text-xs opacity-70">{{ label }}</p>
        <p class="m-0 text-2xl font-semibold leading-tight">{{ value }}</p>
      </div>
    </div>
  `,
})
export class StatTileComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: string | number = '';
  @Input({ required: true }) icon = '';
  @Input() accent: StatTileAccent = 'primary';

  get accentClass(): string {
    return ACCENT_CLASSES[this.accent];
  }
}
