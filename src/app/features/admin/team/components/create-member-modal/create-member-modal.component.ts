import {
  Component,
  EventEmitter,
  Input,
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

import { finalize } from 'rxjs';

import {
  MembershipRole,
  CreateTeamMemberRequest,
  TeamRestaurantOption,
} from '../../../../../core/models/team.model';

import { TeamService } from '../../../../../core/services/team/team.service';
import { WorkspaceRole } from '../../../../../core/models/role.model';
import { RolesService } from '../../../../../core/services/roles/roles.service';

@Component({
  selector: 'app-create-member-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-member-modal.component.html',
  styleUrl: './create-member-modal.component.scss',
})
export class CreateMemberModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly teamService = inject(TeamService);

  @Input({ required: true }) organizationId!: string;

  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  readonly restaurants = signal<TeamRestaurantOption[]>([]);
  readonly loadingRestaurants = signal(false);
  readonly restaurantsError = signal<string | null>(null);

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly roles = signal<WorkspaceRole[]>([]);
  readonly loadingRoles = signal(false);
  readonly rolesError = signal<string | null>(null);

  private readonly rolesService = inject(RolesService);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
    ]],
    email: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(191),
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(128),
    ]],
    confirmPassword: ['', Validators.required],
    role: ['STAFF' as MembershipRole, Validators.required],
    allRestaurants: [false],
    restaurantIds: this.fb.nonNullable.control<string[]>([]),
  });


  ngOnInit(): void {

    this.loadRoles();
    this.loadRestaurants();

  }

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
        },
        error: () => {
          this.rolesError.set('No fue posible cargar los roles.');
        },

      });

  }

  private loadRestaurants(): void {

    if (!this.organizationId) {

      this.restaurantsError.set(

        'No se encontró la organización activa.',

      );

      return;

    }

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

        error: (error) => {

          console.error('Error cargando sedes:', error);

          this.restaurantsError.set(

            'No fue posible cargar las sedes. Intenta nuevamente.',

          );

        },

      });

  }

  toggleRestaurant(restaurantId: string): void {
    const selectedIds = this.form.controls.restaurantIds.value;

    const updatedIds = selectedIds.includes(restaurantId)
      ? selectedIds.filter((id) => id !== restaurantId)
      : [...selectedIds, restaurantId];

    this.form.controls.restaurantIds.setValue(updatedIds);
    this.form.controls.restaurantIds.markAsTouched();
  }

  submit(): void {
    if (this.saving()) return;

    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (value.password !== value.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    const restaurantIds = [...new Set(value.restaurantIds)];

    if (!value.allRestaurants && restaurantIds.length === 0) {
      this.errorMessage.set(
        'Selecciona al menos un restaurante o habilita el acceso a todos.',
      );
      return;
    }

    if (!this.organizationId) {
      this.errorMessage.set(
        'No se encontró la organización activa.',
      );
      return;
    }

    const payload: CreateTeamMemberRequest & {
      firstName: string;
      password: string;
    } = {
      firstName: value.firstName.trim(),
      email: value.email.trim().toLowerCase(),
      password: value.password,
      role: value.role,
      allRestaurants: value.allRestaurants,
      ...(value.allRestaurants ? {} : { restaurantIds }),
    };

    this.saving.set(true);

    this.teamService
      .createMember(this.organizationId, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.created.emit();
          this.closed.emit();
        },
        error: (error) => {
          const message = error?.error?.message;

          this.errorMessage.set(
            Array.isArray(message)
              ? message.join(' ')
              : typeof message === 'string'
                ? message
                : 'No fue posible crear el miembro.',
          );
        },
      });
  }

  close(): void {
    if (this.saving()) return;

    this.closed.emit();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }
}