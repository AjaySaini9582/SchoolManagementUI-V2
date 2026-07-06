import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { toSignal } from '@angular/core/rxjs-interop';

import { SchoolProfileContextService } from '../../core/services/school-profile-context.service';
import { BELOW_MD_BREAKPOINT } from '../../shared/breakpoints';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [MatSidenavModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly schoolProfileContext = inject(SchoolProfileContextService);
  private readonly titleService = inject(Title);

  private readonly isMobile = toSignal(
    this.breakpointObserver.observe(BELOW_MD_BREAKPOINT).pipe(map((result) => result.matches)),
    { initialValue: this.breakpointObserver.isMatched(BELOW_MD_BREAKPOINT) },
  );

  readonly sidenavMode = () => (this.isMobile() ? 'over' : 'side');
  readonly sidenavOpened = signal(!this.breakpointObserver.isMatched(BELOW_MD_BREAKPOINT));

  constructor() {
    // Auto-open on desktop, auto-close on mobile when crossing the
    // breakpoint; the hamburger button still overrides within either mode.
    effect(() => this.sidenavOpened.set(!this.isMobile()), { allowSignalWrites: true });

    // Loaded once per session; the topbar reads the same cached signal.
    this.schoolProfileContext.load().subscribe();
    effect(() => {
      const name = this.schoolProfileContext.schoolProfile()?.name;
      this.titleService.setTitle(name || 'School Management');
    });
  }

  toggleSidenav(): void {
    this.sidenavOpened.update((opened) => !opened);
  }
}
