import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import {
  catchError,
  finalize,
  shareReplay,
  tap,
} from 'rxjs/operators';

import {
  WorkspaceContext,
  WorkspaceResponse,
  WorkspaceUser,
} from '../../models/workspace/workspace.model';

import { WorkspaceService } from './workspace.service';
import { AuthStateService } from '../auth/auth-state.service';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceStateService {
  private readonly workspaceState =
    signal<WorkspaceContext | null>(null);

  private readonly workspaceUserState =
    signal<WorkspaceUser | null>(null);

  private readonly loadingState = signal(false);

  private readonly errorState =
    signal<string | null>(null);

  private request$?: Observable<WorkspaceResponse>;

  readonly workspace = this.workspaceState.asReadonly();

  readonly user = this.workspaceUserState.asReadonly();

  readonly loading = this.loadingState.asReadonly();

  readonly error = this.errorState.asReadonly();

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly authState: AuthStateService,
  ) {}

  /**
   * Carga el workspace de la sede activa.
   *
   * Si la suscripción no está activa, el backend
   * rechazará el acceso. La sesión se conserva,
   * pero el workspace permanece vacío.
   */
  loadWorkspace(): Observable<WorkspaceResponse> {
    const restaurantId =
      this.authState.activeRestaurantId();

    if (!restaurantId) {
      this.clear();

      return throwError(
        () => new Error(
          'No hay una sede seleccionada para cargar el workspace.',
        ),
      );
    }

    if (this.request$) {
      return this.request$;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    this.request$ = this.workspaceService
      .getWorkspace(restaurantId)
      .pipe(
        tap((response) => {
          this.workspaceUserState.set(
            response.data.user,
          );

          this.workspaceState.set(
            response.data.workspace,
          );
        }),

        catchError((error: unknown) => {
          this.workspaceState.set(null);
          this.workspaceUserState.set(null);

          if (
            error instanceof HttpErrorResponse &&
            error.status === 403
          ) {
            this.errorState.set(
              'Tu organización necesita una suscripción activa para acceder al workspace.',
            );
          } else {
            this.errorState.set(
              'No fue posible cargar la información del workspace.',
            );
          }

          return throwError(() => error);
        }),

        finalize(() => {
          this.loadingState.set(false);
          this.request$ = undefined;
        }),

        shareReplay({
          bufferSize: 1,
          refCount: true,
        }),
      );

    return this.request$;
  }

  /**
   * Cambia la sede activa y carga su workspace.
   */
  selectRestaurant(
    restaurantId: string,
  ): Observable<WorkspaceResponse> {
    const selected =
      this.authState.selectRestaurant(restaurantId);

    if (!selected) {
      return throwError(
        () => new Error(
          'No tienes acceso a la sede seleccionada.',
        ),
      );
    }

    this.clear();

    return this.loadWorkspace();
  }

  /**
   * Limpia el workspace sin cerrar la sesión.
   */
  clear(): void {
    this.workspaceState.set(null);
    this.workspaceUserState.set(null);
    this.errorState.set(null);
    this.loadingState.set(false);
    this.request$ = undefined;
  }
}