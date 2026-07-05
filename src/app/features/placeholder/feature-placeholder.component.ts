import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Stand-in for feature pages not yet built, so the shell's nav is fully
 * clickable end-to-end. Route `data.title` sets the heading. */
@Component({
  selector: 'app-feature-placeholder',
  standalone: true,
  template: `
    <div class="placeholder">
      <h1>{{ title }}</h1>
      <p>This section hasn't been built yet.</p>
    </div>
  `,
  styles: `
    .placeholder {
      padding: 1.5rem;
    }
  `,
})
export class FeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title: string = this.route.snapshot.data['title'] ?? 'Coming soon';
}
