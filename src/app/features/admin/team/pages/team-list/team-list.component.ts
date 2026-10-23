import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import {
  MembershipRole,
  TeamMember,
  TeamMembersQuery,
} from '../../../../../core/models/team.model';

import { WorkspaceStateService } from '../../../../../core/services/workspace/workspace-state.service';

import { TeamService } from '../../../../../core/services/team/team.service';
import { CreateMemberModalComponent } from '../../components/create-member-modal/create-member-modal.component';
import { EditMemberModalComponent } from '../../components/edit-member-modal/edit-member-modal.component';
import { finalize } from 'rxjs';
import { RevokeMemberModalComponent } from '../../components/revoke-member-modal/revoke-member-modal.component';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CreateMemberModalComponent,
    EditMemberModalComponent,
    RevokeMemberModalComponent
  ],
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss',
})
export class TeamListComponent implements OnInit {
  private readonly workspaceState = inject(
    WorkspaceStateService,
  );

  private readonly teamService = inject(
    TeamService,
  );

  readonly organizationId = computed(
  () => this.workspaceState.workspace()?.restaurant.organizationId ?? null,
);

readonly selectedMember = signal<TeamMember | null>(null);
readonly showEditMember = signal(false);
readonly showRevokeConfirmation = signal(false);
readonly revokingMember = signal(false);

openEditMember(member: TeamMember): void {
  this.selectedMember.set(member);
  this.showEditMember.set(true);
}

closeEditMember(): void {
  this.showEditMember.set(false);
  this.selectedMember.set(null);
}

openRevokeConfirmation(member: TeamMember): void {
  this.selectedMember.set(member);
  this.showRevokeConfirmation.set(true);
}

closeRevokeConfirmation(): void {
  this.showRevokeConfirmation.set(false);
  this.selectedMember.set(null);
}

confirmRevokeMember(): void {
  const member = this.selectedMember();
  const organizationId = this.organizationId();

  if (
    !this.canManageTeam() ||
    !member ||
    !organizationId ||
    this.revokingMember()
  ) {
    return;
  }

  if (member.role === 'OWNER') {
    return;
  }

  this.revokingMember.set(true);

  this.teamService
    .removeMember(organizationId, member.id)
    .pipe(finalize(() => this.revokingMember.set(false)))
    .subscribe({
      next: () => {
        this.showRevokeConfirmation.set(false);
        this.selectedMember.set(null);
        this.loadMembers();
      },
      error: (error: unknown) => {
        console.error('Error revocando acceso:', error);

        this.error.set(
          'No fue posible revocar el acceso. Verifica tus permisos e inténtalo nuevamente.',
        );
      },
    });
}

  // Estados
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Miembros
  readonly members = signal<TeamMember[]>([]);

  // Paginación
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(0);

  // Filtros
  readonly search = signal('');
  readonly selectedRole = signal<MembershipRole | ''>('');
  readonly selectedRestaurantId = signal('');


// Formulario de creación
readonly showCreateMember = signal(false);
readonly creatingMember = signal(false);
readonly createMemberError = signal<string | null>(null);

openCreateMember(): void {
  if (!this.canManageTeam()) {
    return;
  }

  this.createMemberError.set(null);
  this.showCreateMember.set(true);
}

closeCreateMember(): void {
  if (this.creatingMember()) {
    return;
  }

  this.showCreateMember.set(false);
  this.createMemberError.set(null);
}

  // Permisos del usuario actual
  readonly canManageTeam = computed(() => {
    const workspace = this.workspaceState.workspace();

    return workspace?.permissions.includes('team.manage') ?? false;
  });

  // Contadores
  readonly ownerCount = computed(() =>
    this.members().filter(
      (member) => member.role === 'OWNER',
    ).length,
  );

  readonly adminCount = computed(() =>
    this.members().filter(
      (member) => member.role === 'ADMIN',
    ).length,
  );

  // Búsqueda local por nombre o correo
  readonly filteredMembers = computed(() => {
    const term = this.search()
      .trim()
      .toLowerCase();

    if (!term) {
      return this.members();
    }

    return this.members().filter((member) => {
      const firstName = member.user.firstName
        .toLowerCase();

      const email = member.user.email
        .toLowerCase();

      return (
        firstName.includes(term) ||
        email.includes(term)
      );
    });
  });

  // Roles disponibles
  readonly roles: MembershipRole[] = [
    'OWNER',
    'ADMIN',
    'MANAGER',
    'STAFF',
  ];

  ngOnInit(): void {
    this.loadMembers();
  }

  /**
   * Carga los miembros de la organización activa.
   */
  loadMembers(): void {
    const workspace = this.workspaceState.workspace();

    if (!workspace) {
      this.error.set(
        'No hay un espacio de trabajo activo.',
      );

      return;
    }

    // El modelo WorkspaceContext contiene restaurant.organizationId.
    const organizationId =
      workspace.restaurant.organizationId;

    if (!organizationId) {
      this.error.set(
        'No fue posible identificar la organización activa.',
      );

      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const query: TeamMembersQuery = {
      page: this.page(),
      limit: this.limit(),
    };

    if (this.selectedRole()) {
      query.role = this.selectedRole() as MembershipRole;
    }

    if (this.selectedRestaurantId()) {
      query.restaurantIds = [
        this.selectedRestaurantId(),
      ];
    }

    this.teamService
      .getMembers(organizationId, query)
      .subscribe({
        next: (response) => {
          this.members.set(response.data ?? []);

          this.total.set(
            response.pagination.total,
          );

          this.totalPages.set(
            response.pagination.totalPages,
          );

          this.page.set(
            response.pagination.page,
          );

          this.limit.set(
            response.pagination.limit,
          );

          this.loading.set(false);
        },

        error: (error: unknown) => {
          console.error(
            'Error al cargar los miembros:',
            error,
          );

          if (error instanceof HttpErrorResponse) {
            if (error.status === 401) {
              this.error.set(
                'Tu sesión ha expirado. Inicia sesión nuevamente.',
              );
            } else if (error.status === 403) {
              this.error.set(
                'No tienes permisos para consultar el equipo.',
              );
            } else if (error.status === 404) {
              this.error.set(
                'No se encontró la organización solicitada.',
              );
            } else {
              this.error.set(
                'No fue posible cargar los miembros. Inténtalo nuevamente.',
              );
            }
          } else {
            this.error.set(
              'Ocurrió un error inesperado al cargar los miembros.',
            );
          }

          this.loading.set(false);
        },
      });
  }

  /**
   * Aplica los filtros seleccionados.
   */
  applyFilters(): void {
    this.page.set(1);
    this.loadMembers();
  }

  /**
   * Limpia los filtros y vuelve a cargar los miembros.
   */
  clearFilters(): void {
    this.search.set('');
    this.selectedRole.set('');
    this.selectedRestaurantId.set('');

    this.page.set(1);

    this.loadMembers();
  }

  /**
   * Navega a la página anterior.
   */
  previousPage(): void {
    if (this.page() <= 1) {
      return;
    }

    this.page.update(
      (value) => value - 1,
    );

    this.loadMembers();
  }

  /**
   * Navega a la página siguiente.
   */
  nextPage(): void {
    if (this.page() >= this.totalPages()) {
      return;
    }

    this.page.update(
      (value) => value + 1,
    );

    this.loadMembers();
  }

  /**
   * Identificador para optimizar el renderizado de la tabla.
   */
  trackByMember(
    _index: number,
    member: TeamMember,
  ): string {
    return member.id;
  }

  /**
   * Obtiene los nombres de los restaurantes asignados.
   */
  getRestaurantNames(
    member: TeamMember,
  ): string {
    return member.restaurants
      .map(
        (restaurant) => restaurant.name,
      )
      .join(', ');
  }

  /**
   * Obtiene las iniciales del usuario.
   */
  getInitial(
    firstName: string,
  ): string {
    const name = firstName.trim();

    return name
      ? name.charAt(0).toUpperCase()
      : '?';
  }
}