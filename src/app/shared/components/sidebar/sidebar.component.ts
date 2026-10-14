import {
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
  readonly workspace = input<WorkspaceContext | null>(null);
  readonly collapsed = input(false);
  readonly closeMenu = output<void>();

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
}