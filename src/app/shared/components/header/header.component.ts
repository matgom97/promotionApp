import {
  Component,
  computed,
  output,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth/auth.service';
import { AuthStateService } from '../../../core/services/auth/auth-state.service';
import { WorkspaceStateService } from '../../../core/services/workspace/workspace-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class AppHeaderComponent {
  readonly authService = inject(AuthService);
  readonly authState = inject(AuthStateService);
  readonly workspaceState = inject(WorkspaceStateService);

  private readonly router = inject(Router);

  readonly toggleSidebar = output<void>();

  readonly loggingOut = signal(false);

  readonly switchingRestaurant = computed(
    () => this.workspaceState.loading(),
  );

  onRestaurantChange(restaurantId: string): void {
    if (!restaurantId) {
      return;
    }

    const currentWorkspace = this.workspaceState.workspace();

    if (currentWorkspace?.restaurant.id === restaurantId) {
      return;
    }

    try {
      this.workspaceState
        .selectRestaurant(restaurantId)
        .subscribe({
          error: (error: unknown) => {
            console.error(
              'No fue posible cambiar de sede:',
              error,
            );
          },
        });
    } catch (error: unknown) {
      console.error(
        'No fue posible seleccionar la sede:',
        error,
      );
    }
  }

  logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);

    this.authService
      .logout()
      .pipe(
        finalize(() => this.loggingOut.set(false)),
      )
      .subscribe({
        next: () => {
          this.finishLogout();
        },
        error: (error: unknown) => {
          console.error(
            'Error al cerrar sesión:',
            error,
          );

          /*
           * Limpiamos el estado local aunque la petición falle.
           * Esto no garantiza que el servidor haya revocado
           * el refresh token si no recibió la petición.
           */
          this.finishLogout();
        },
      });
  }

  private finishLogout(): void {
    this.authState.clearSession();
    this.workspaceState.clear();

    void this.router.navigate(
      ['/auth/login'],
      { replaceUrl: true },
    );
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}