import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { WorkspaceStateService } from '../../core/services/workspace/workspace-state.service';


import { AppHeaderComponent } from '../../shared/components/header/header.component';
import { AppSidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AppHeaderComponent,
    AppSidebarComponent,
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent implements OnInit {
  readonly workspaceState = inject(WorkspaceStateService);

  readonly sidebarCollapsed = signal(false);
  readonly mobileMenuOpen = signal(false);

  ngOnInit(): void {
    if (!this.workspaceState.workspace()) {
      this.retryWorkspace();
    }
  }

  retryWorkspace(): void {
    try {
      this.workspaceState.loadWorkspace().subscribe({
        error: (error: unknown) => {
          console.error(
            'Error cargando el workspace:',
            error,
          );
        },
      });
    } catch (error: unknown) {
      console.error(
        'No fue posible iniciar la carga del workspace:',
        error,
      );
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}