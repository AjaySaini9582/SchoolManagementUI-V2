import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-authorized',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <div class="not-authorized">
      <h1>Not authorized</h1>
      <p>Your role doesn't have access to this page.</p>
      <button mat-flat-button color="primary" (click)="goHome()">Back to app</button>
    </div>
  `,
  styles: `
    .not-authorized {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      min-height: 100%;
      padding: 2rem;
      text-align: center;
    }
  `,
})
export class NotAuthorizedComponent {
  private readonly router = inject(Router);

  goHome(): void {
    this.router.navigateByUrl('/');
  }
}
