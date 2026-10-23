import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnDestroy,
  Output,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { finalize, Subscription } from 'rxjs';

import {
  MembershipRole,
  TeamMember,
  UpdateTeamMemberRequest,
  TeamRestaurantOption,
} from '../../../../../core/models/team.model';

import { TeamService } from '../../../../../core/services/team/team.service';
import { RolesService } from '../../../../../core/services/roles/roles.service';

import { WorkspaceRole } from '../../../../../core/models/role.model';
import { log } from 'console';

@Component({
  selector: 'app-edit-member-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-member-modal.component.html',
  styleUrl: './edit-member-modal.component.scss',
})
export class EditMemberModalComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly teamService = inject(TeamService);
  private readonly rolesService = inject(RolesService);

  private passwordSubscription?: Subscription;

  @Input({ required: true }) organizationId!: string;
  @Input({ required: true }) memberId!: string;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // Estados del componente
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadingRestaurants = signal(false);
  readonly loadingRoles = signal(false);


  // Visibilidad de la contraseña
  readonly showPassword = signal(false);

  // Mensajes de error
  readonly errorMessage = signal<string | null>(null);
  readonly restaurantsError = signal<string | null>(null);
  readonly rolesError = signal<string | null>(null);

  // Datos del miembro, sedes y roles
  readonly member = signal<TeamMember | null>(null);
  readonly restaurants = signal<TeamRestaurantOption[]>([]);
  readonly roles = signal<WorkspaceRole[]>([]);



  // Formulario de edición
  readonly form = this.fb.nonNullable.group({
    role: ['STAFF' as MembershipRole, Validators.required],
    roleId: [''],
    allRestaurants: [false],
    restaurantIds: this.fb.nonNullable.control<string[]>([]),

    // Cambio opcional de contraseña
    changePassword: [false],
    password: [
      '',
      [
        Validators.minLength(8),
        Validators.maxLength(128),
      ],
    ],
    confirmPassword: [''],
  });

  // =====================================================
  // CICLO DE VIDA
  // =====================================================

  ngOnInit(): void {
    this.configurePasswordValidation();
    this.loadMember();
    this.loadRestaurants();
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.passwordSubscription?.unsubscribe();
  }



  // =====================================================
  // VALIDACIÓN DE CONTRASEÑA
  // =====================================================

  private configurePasswordValidation(): void {
    this.passwordSubscription =
      this.form.controls.changePassword.valueChanges.subscribe(
        (enabled) => {
          const password = this.form.controls.password;
          const confirmPassword =
            this.form.controls.confirmPassword;

          if (enabled) {
            password.setValidators([
              Validators.required,
              Validators.minLength(8),
              Validators.maxLength(128),
            ]);

            confirmPassword.setValidators([
              Validators.required,
            ]);
          } else {
            password.clearValidators();
            confirmPassword.clearValidators();

            password.setValue('');
            confirmPassword.setValue('');

            password.markAsUntouched();
            confirmPassword.markAsUntouched();

            this.showPassword.set(false);
          }

          password.updateValueAndValidity();
          confirmPassword.updateValueAndValidity();

          this.errorMessage.set(null);
        },
      );
  }

  // =====================================================
  // CARGAR INFORMACIÓN DEL MIEMBRO
  // =====================================================

  private syncRoleSelection(): void {
    const currentMember = this.member();

    if (!currentMember || this.loadingRoles()) {
      return;
    }

    // El propietario no puede cambiar de rol.
    if (currentMember.role === 'OWNER') {
      return;
    }

    const matchingRole = this.roles().find(
      (role) => role.code === currentMember.role,
    );

    this.form.controls.roleId.setValue(
      matchingRole?.id ?? '',
      { emitEvent: false },
    );
  }

  private loadMember(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.teamService
      .getMember(this.organizationId, this.memberId)
      .pipe(
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (member) => {
          this.member.set(member);

          this.form.patchValue({
            role: member.role,
            allRestaurants: member.allRestaurants,
            restaurantIds: member.allRestaurants
              ? []
              : member.restaurants.map((restaurant) => restaurant.id),
            roleId: '',
            changePassword: false,
            password: '',
            confirmPassword: '',
          });

          if (member.role === 'OWNER') {
            this.form.controls.role.disable();
          }

          this.syncRoleSelection();
        },

        error: (error: unknown) => {
          console.error(
            'Error cargando miembro:',
            error,
          );

          this.errorMessage.set(
            'No fue posible cargar la información del miembro.',
          );
        },
      });
  }

  // =====================================================
  // CARGAR SEDES
  // =====================================================

  private loadRestaurants(): void {
    this.loadingRestaurants.set(true);
    this.restaurantsError.set(null);

    this.teamService
      .getRestaurants(this.organizationId)
      .pipe(
        finalize(() => this.loadingRestaurants.set(false)),
      )
      .subscribe({
        next: (restaurants) => {
          this.restaurants.set(
            restaurants.filter(
              (restaurant) => restaurant.status === 'ACTIVE',
            ),
          );
        },

        error: (error: unknown) => {
          console.error(
            'Error cargando sedes:',
            error,
          );

          this.restaurantsError.set(
            'No fue posible cargar las sedes disponibles.',
          );
        },
      });
  }

  // =====================================================
  // CARGAR ROLES
  // =====================================================

  private loadRoles(): void {
    if (!this.organizationId) {
      this.rolesError.set('No se encontró la organización activa.');
      return;
    }

    this.loadingRoles.set(true);
    this.rolesError.set(null);

    this.rolesService
      .getRoles(this.organizationId)
      .pipe(finalize(() => this.loadingRoles.set(false)))
      .subscribe({
        next: (roles) => {
          this.roles.set(roles.filter((role) => role.isActive));
          this.syncRoleSelection();
        },
        error: (error: unknown) => {
          console.error('Error cargando roles:', error);
          this.rolesError.set('No fue posible cargar los roles.');
        },
      });
  }

  // =====================================================
  // MOSTRAR U OCULTAR CONTRASEÑA
  // =====================================================

  togglePasswordVisibility(): void {
    this.showPassword.update(
      (visible) => !visible,
    );
  }

  // =====================================================
  // SELECCIONAR O QUITAR SEDES
  // =====================================================

  toggleRestaurant(restaurantId: string): void {
    const selected =
      this.form.controls.restaurantIds.value;

    const updated = selected.includes(restaurantId)
      ? selected.filter((id) => id !== restaurantId)
      : [...selected, restaurantId];

    this.form.controls.restaurantIds.setValue(updated);
    this.form.controls.restaurantIds.markAsTouched();

    this.errorMessage.set(null);
  }

  // =====================================================
  // CERRAR MODAL
  // =====================================================

  close(): void {
    if (this.saving()) {
      return;
    }

    this.closed.emit();
  }

  // =====================================================
  // GUARDAR CAMBIOS
  // =====================================================

  submit(): void {
    if (this.saving() || this.loading()) {
      return;
    }

    this.errorMessage.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.errorMessage.set(
        'Revisa los campos del formulario antes de continuar.',
      );
      return;
    }

    const value = this.form.getRawValue();
    const currentMember = this.member();

    if (!currentMember) {
      this.errorMessage.set(
        'No se encontró la información del miembro.',
      );
      return;
    }

    console.log(value.role);
    

    // Protección del rol OWNER
    if (
      currentMember.role !== 'OWNER' &&
      (value.role as string) === 'OWNER'
    ) {
      this.errorMessage.set(
        'No puedes asignar el rol de propietario desde este formulario.',
      );
      return;
    }

    // Validar selección de sedes
    if (
      !value.allRestaurants &&
      value.restaurantIds.length === 0
    ) {
      this.errorMessage.set(
        'Selecciona al menos una sede o habilita el acceso a todas.',
      );
      return;
    }

    // Validar contraseña si se solicitó el cambio
    if (value.changePassword) {
      if (
        value.password.length < 8 ||
        value.password.length > 128
      ) {
        this.errorMessage.set(
          'La contraseña debe tener entre 8 y 128 caracteres.',
        );
        return;
      }

      if (value.password !== value.confirmPassword) {
        this.errorMessage.set(
          'Las contraseñas no coinciden.',
        );
        return;
      }
    }

    // Preparar petición de actualización
    const payload: UpdateTeamMemberRequest = {
      allRestaurants: value.allRestaurants,

      restaurantIds: value.allRestaurants
        ? []
        : [...value.restaurantIds],
    };

    // No modificar el rol del propietario
    if (currentMember.role !== 'OWNER') {
      payload.role = value.role;
    }

    // Enviar contraseña únicamente cuando se solicita el cambio
    if (value.changePassword) {
      payload.password = value.password;
    }

    this.saving.set(true);

    this.teamService
      .updateMember(
        this.organizationId,
        this.memberId,
        payload,
      )
      .pipe(
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.saved.emit();
          this.closed.emit();
        },

        error: (error: unknown) => {
          console.error(
            'Error actualizando miembro:',
            error,
          );

          this.errorMessage.set(
            'No fue posible guardar los cambios. Verifica tus permisos e inténtalo nuevamente.',
          );
        },
      });
  }
}