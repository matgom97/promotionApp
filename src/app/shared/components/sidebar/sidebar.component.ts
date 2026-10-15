import {
  Component,
  computed,
  input,
  output,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth.service';
import { AuthStateService } from '../../../core/services/auth/auth-state.service';
import { WorkspaceStateService } from '../../../core/services/workspace/workspace-state.service';

import { WorkspaceContext } from '../../../core/models/workspace/workspace.model';

interface NavigationItem {
  label: string;
  description: string;
  route: string;
  icon: string;
  permissions: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class AppSidebarComponent {

  /**
 * Controla la apertura del selector de sedes.
 */
  readonly restaurantSelectorOpen = signal(false);

  /**
   * Indica si se está cambiando de sede.
   */
  readonly switchingRestaurant = computed(
    () => this.workspaceState.loading(),
  );

  private readonly authService = inject(AuthService);
  readonly authState = inject(AuthStateService);
  private readonly workspaceState = inject(WorkspaceStateService);
  private readonly router = inject(Router);

  readonly workspace = input<WorkspaceContext | null>(null);
  readonly collapsed = input(false);

  readonly closeMenu = output<void>();
  readonly toggleCollapsed = output<void>();

  readonly loggingOut = signal(false);

  private readonly navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      description: 'Resumen general',
      route: '/app/dashboard',
      icon: 'grid',
      permissions: ['dashboard.view'],
    },
    {
      label: 'Promociones',
      description: 'Gestiona tus promociones',
      route: '/app/promotions',
      icon: 'tag',
      permissions: ['promotions.view'],
    },
    {
      label: 'Canjes',
      description: 'Valida y consulta canjes',
      route: '/app/redemptions',
      icon: 'ticket',
      permissions: ['redemptions.view'],
    },
    {
      label: 'Clientes',
      description: 'Consulta tus clientes',
      route: '/app/customers',
      icon: 'users',
      permissions: ['customers.view'],
    },
    {
      label: 'Analítica',
      description: 'Resultados y estadísticas',
      route: '/app/analytics',
      icon: 'chart',
      permissions: ['analytics.view'],
    },
    {
      label: 'Equipo',
      description: 'Usuarios y permisos',
      route: '/app/team',
      icon: 'team',
      permissions: ['team.view'],
    },
    {
      label: 'Configuración',
      description: 'Configura tu negocio',
      route: '/app/settings',
      icon: 'settings',
      permissions: ['settings.view'],
    },
  ];

  readonly visibleItems = computed(() => {
    const currentWorkspace = this.workspace();

    if (!currentWorkspace) {
      return [];
    }

    const permissions = new Set(
      currentWorkspace.permissions,
    );

    return this.navigationItems.filter((item) =>
      item.permissions.some((permission) =>
        permissions.has(permission),
      ),
    );
  });

  onNavigate(): void {
    this.closeMenu.emit();
  }

  onToggleCollapsed(): void {
    this.toggleCollapsed.emit();
  }

  /**
 * Abre o cierra el selector de sedes.
 */
  toggleRestaurantSelector(): void {
    if (this.switchingRestaurant()) {
      return;
    }

    this.restaurantSelectorOpen.update(
      (isOpen) => !isOpen,
    );
  }

  /**
   * Selecciona una sede y actualiza el workspace.
   */
  onRestaurantChange(restaurantId: string): void {
    if (!restaurantId || this.switchingRestaurant()) {
      return;
    }

    const currentWorkspace = this.workspaceState.workspace();

    // Evitar recargar la sede que ya está seleccionada.
    if (currentWorkspace?.restaurant.id === restaurantId) {
      this.restaurantSelectorOpen.set(false);
      return;
    }

    this.workspaceState.selectRestaurant(restaurantId).subscribe({
      next: () => {
        this.restaurantSelectorOpen.set(false);
      },

      error: (error: unknown) => {
        console.error(
          'No fue posible cambiar de sede:',
          error,
        );
      },
    });
  }

  /**
   * Cierra el selector cuando el usuario hace clic fuera.
   */
  closeRestaurantSelector(): void {
    this.restaurantSelectorOpen.set(false);
  }


  logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);

    this.authService.logout().subscribe({
      next: () => {
        this.finishLogout();
      },
      error: (error: unknown) => {
        console.error(
          'No fue posible confirmar el cierre de sesión:',
          error,
        );

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
}