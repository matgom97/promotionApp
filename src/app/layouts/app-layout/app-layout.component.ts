import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterOutlet } from '@angular/router';

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

  private readonly router = inject(Router);

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

          if (this.isSubscriptionAccessDenied(error)) {
            this.workspaceState.clear();

            void this.router.navigate(
              ['/auth/subscription'],
            );
          }
        },
      });
    } catch (error: unknown) {
      console.error(
        'No fue posible iniciar la carga del workspace:',
        error,
      );
    }
  }

  /**
   * Identifica exclusivamente el error de suscripción
   * que devuelve el backend.
   */
  private isSubscriptionAccessDenied(
    error: unknown,
  ): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    if (error.status !== 403) {
      return false;
    }

    const message = error.error?.message;

    const messages = Array.isArray(message)
      ? message.join(' ')
      : String(message ?? '');

    return (
      messages.includes(
        'An active and valid subscription is required to access this workspace.',
      ) ||
      messages.includes('SUBSCRIPTION_ACCESS_DENIED') ||
      messages.includes('SUBSCRIPTION_REQUIRED')
    );
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(
      (collapsed) => !collapsed,
    );
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(
      (open) => !open,
    );
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  onHeaderMenuToggle(): void {
    if (window.matchMedia('(max-width: 768px)').matches) {
      this.toggleMobileMenu();
      return;
    }

    this.toggleSidebar();
  }
}