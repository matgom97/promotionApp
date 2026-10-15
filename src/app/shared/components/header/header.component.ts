import {
  Component,
  HostListener,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth.service';
import { AuthStateService } from '../../../core/services/auth/auth-state.service';
import { WorkspaceStateService } from '../../../core/services/workspace/workspace-state.service';

interface HelpItem {
  label: string;
  description: string;
  route: string;
  icon: 'book' | 'message';
}

type PlanType = 'STARTER' | 'PRO' | 'BUSINESS';

type MembershipVariant = 'success' | 'warning' | 'danger';

interface MembershipStatus {
  label: string;
  variant: MembershipVariant;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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

  readonly helpMenuOpen = signal(false);
  readonly userMenuOpen = signal(false);
  readonly membershipMenuOpen = signal(false);

  /**
   * Propietario de la organización.
   */
  readonly isOwner = computed(() => {
    const role = this.workspaceState.workspace()?.role;

    return role?.code?.toUpperCase() === 'OWNER';
  });

  /**
   * Identifica el plan para asignarle su apariencia visual.
   *
   * Los nombres proceden del backend.
   */
  readonly planType = computed<PlanType>(() => {
    const plan = this.workspaceState.workspace()?.plan;

    const name = plan?.name?.trim().toUpperCase() ?? '';

    if (name.includes('BUSINESS')) {
      return 'BUSINESS';
    }

    if (name.includes('PRO')) {
      return 'PRO';
    }

    return 'STARTER';
  });

  /**
   * Clase CSS correspondiente al plan.
   */
  readonly planVisualClass = computed(() => {
    return `app-header__membership--${this.planType().toLowerCase()}`;
  });

  /**
   * Estado visual de la suscripción.
   */
  readonly membershipStatus = computed<MembershipStatus>(() => {
    const workspace = this.workspaceState.workspace();
    const subscription = workspace?.subscription;

    if (!workspace?.plan) {
      return {
        label: 'Sin plan disponible',
        variant: 'warning',
      };
    }

    if (!subscription) {
      return {
        label: 'Sin suscripción',
        variant: 'warning',
      };
    }

    const status = subscription.status.toUpperCase();

    switch (status) {
      case 'ACTIVE':
        return {
          label: 'Activa',
          variant: 'success',
        };

      case 'TRIALING': {
        const daysRemaining = this.getDaysRemaining(
          subscription.trialEndsAt,
        );

        return {
          label: daysRemaining === null
            ? 'Prueba gratuita'
            : daysRemaining === 0
              ? 'Prueba finaliza hoy'
              : `Prueba · ${daysRemaining} días`,
          variant: 'warning',
        };
      }

      case 'PAST_DUE':
        return {
          label: 'Pago vencido',
          variant: 'danger',
        };

      case 'UNPAID':
        return {
          label: 'Pago pendiente',
          variant: 'danger',
        };

      case 'CANCELED':
        return {
          label: 'Cancelada',
          variant: 'danger',
        };

      case 'EXPIRED':
        return {
          label: 'Vencida',
          variant: 'danger',
        };

      case 'PENDING':
        return {
          label: 'Pendiente',
          variant: 'warning',
        };

      default:
        return {
          label: subscription.status,
          variant: 'warning',
        };
    }
  });

  /**
   * Información temporal de la membresía.
   *
   * Utiliza las fechas disponibles en la respuesta del backend.
   * No calcula ni inventa fechas de renovación.
   */
  readonly membershipPeriod = computed(() => {
    const subscription = this.workspaceState.workspace()?.subscription;

    if (!subscription) {
      return null;
    }

    const status = subscription.status.toUpperCase();

    if (status === 'TRIALING') {
      const trialEnd = subscription.trialEndsAt;

      if (!trialEnd) {
        return null;
      }

      const daysRemaining = this.getDaysRemaining(trialEnd);

      return {
        label: 'Finaliza la prueba',
        date: this.formatMembershipDate(trialEnd),
        daysRemaining,
        variant: daysRemaining === 0 ? 'warning' : 'success',
      };
    }

    const periodEnd = subscription.currentPeriodEnd;

    if (!periodEnd) {
      return null;
    }

    const isCanceled = status === 'CANCELED';
    const isExpired = status === 'EXPIRED';

    const daysRemaining = this.getDaysRemaining(periodEnd);

    if (isExpired || (daysRemaining === 0 && !isCanceled)) {
      return {
        label: 'Vencimiento del período',
        date: this.formatMembershipDate(periodEnd),
        daysRemaining,
        variant: 'danger',
      };
    }

    if (isCanceled) {
      return {
        label: 'Fin de la suscripción',
        date: this.formatMembershipDate(periodEnd),
        daysRemaining,
        variant: 'warning',
      };
    }

    return {
      label: 'Próxima renovación',
      date: this.formatMembershipDate(periodEnd),
      daysRemaining,
      variant: daysRemaining !== null && daysRemaining <= 5
        ? 'warning'
        : 'success',
    };
  });

  /**
   * Texto accesible para el botón de membresía.
   */
  readonly membershipAriaLabel = computed(() => {
    const plan = this.workspaceState.workspace()?.plan;

    const status = this.membershipStatus();

    return plan
      ? `Plan ${plan.name}. Estado: ${status.label}`
      : 'Consultar membresía';
  });

  /**
   * Iniciales del usuario para el avatar.
   */
  readonly userInitials = computed(() => {
    const firstName = this.workspaceState.user()?.firstName?.trim();

    if (!firstName) {
      return 'U';
    }

    return firstName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  /**
   * Opciones disponibles en el menú de ayuda.
   */
  readonly helpItems: HelpItem[] = [
    {
      label: 'Centro de ayuda',
      description: 'Guías y documentación',
      route: '/app/help',
      icon: 'book',
    },
    {
      label: 'Soporte técnico',
      description: 'Consulta las opciones de soporte',
      route: '/app/support',
      icon: 'message',
    },
  ];

  /**
   * Emite el evento para controlar el sidebar.
   */
  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  /**
   * Abre o cierra el menú de ayuda.
   */
  toggleHelpMenu(): void {
    this.helpMenuOpen.update((open) => !open);

    this.userMenuOpen.set(false);
    this.membershipMenuOpen.set(false);
  }

  /**
   * Abre o cierra el menú de usuario.
   */
  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);

    this.helpMenuOpen.set(false);
    this.membershipMenuOpen.set(false);
  }

  /**
   * Abre o cierra el panel de membresía.
   */
  toggleMembershipMenu(): void {
    if (!this.isOwner()) {
      return;
    }

    this.membershipMenuOpen.update((open) => !open);

    this.userMenuOpen.set(false);
    this.helpMenuOpen.set(false);
  }

  /**
   * Cierra exclusivamente el menú de usuario.
   */
  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  /**
   * Cierra todos los desplegables.
   */
  closeMenus(): void {
    this.helpMenuOpen.set(false);
    this.userMenuOpen.set(false);
    this.membershipMenuOpen.set(false);
  }

  /**
   * Cierra los menús con Escape.
   */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenus();
  }

  /**
   * Calcula los días restantes.
   */
  private getDaysRemaining(
    date: string | Date | null | undefined,
  ): number | null {
    if (!date) {
      return null;
    }

    const endDate = new Date(date);

    if (Number.isNaN(endDate.getTime())) {
      return null;
    }

    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const endDay = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    );

    const difference = endDay.getTime() - today.getTime();

    return Math.max(
      0,
      Math.ceil(difference / (1000 * 60 * 60 * 24)),
    );
  }

  /**
   * Formatea fechas en español colombiano.
   */
  formatMembershipDate(
    date: string | Date | null | undefined,
  ): string {
    if (!date) {
      return 'No disponible';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'No disponible';
    }

    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Bogota',
    }).format(parsedDate);
  }

  /**
   * Formatea el precio de la membresía.
   */
  formatPlanPrice(
    amount: string | number,
    currency: string,
  ): string {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return `${amount} ${currency}`;
    }

    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${amount} ${currency}`;
    }
  }

  /**
   * Traduce la periodicidad del plan.
   */
  billingIntervalLabel(interval: string): string {
    const normalized = interval.toUpperCase();

    const labels: Record<string, string> = {
      MONTHLY: 'Mensual',
      MONTH: 'Mensual',
      YEARLY: 'Anual',
      YEAR: 'Anual',
      ANNUAL: 'Anual',
      WEEKLY: 'Semanal',
      WEEK: 'Semanal',
    };

    return labels[normalized] ?? interval;
  }

  /**
   * Cierra la sesión local incluso si el servidor falla.
   */
  logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);

    this.authService.logout().subscribe({
      next: () => this.finishLogout(),

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
    this.closeMenus();

    void this.router.navigate(
      ['/auth/login'],
      { replaceUrl: true },
    );
  }
}