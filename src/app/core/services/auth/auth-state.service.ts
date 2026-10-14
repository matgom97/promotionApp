import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  catchError,
  finalize,
  map,
  shareReplay,
  tap,
} from 'rxjs/operators';

import {
  AuthRestaurant,
  AuthService,
  AuthUser,
  MeResponse,
  RestaurantMembership,
} from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private readonly userState = signal<AuthUser | null>(null);

  private readonly restaurantsState =
    signal<AuthRestaurant[]>([]);

  private readonly activeRestaurantIdState =
    signal<string | null>(null);

  private initialized = false;

  private initialization$?: Observable<boolean>;

  readonly user = this.userState.asReadonly();

  readonly restaurants = this.restaurantsState.asReadonly();

  readonly activeRestaurantId =
    this.activeRestaurantIdState.asReadonly();

  readonly isAuthenticated = signal(false);

  constructor(
    private readonly authService: AuthService,
  ) {}

  /**
   * Restaurante seleccionado en el contexto actual.
   */
  readonly activeRestaurant = () => {
    const restaurantId = this.activeRestaurantIdState();

    if (!restaurantId) {
      return null;
    }

    return (
      this.restaurantsState().find(
        (restaurant) => restaurant.id === restaurantId,
      ) ?? null
    );
  };

  /**
   * Membresía correspondiente al restaurante seleccionado.
   */
  readonly activeMembership = (): RestaurantMembership | null => {
    return this.activeRestaurant()?.membership ?? null;
  };

  /**
   * Inicializa la sesión consultando el endpoint me.
   */
  initialize(): Observable<boolean> {
    if (this.initialized) {
      return of(this.isAuthenticated());
    }

    if (this.initialization$) {
      return this.initialization$;
    }

    this.initialization$ = this.authService.me().pipe(
      tap((response) => {
        this.setSession(response);
      }),

      map(() => true),

      catchError(() => {
        this.clearSession();
        return of(false);
      }),

      finalize(() => {
        this.initialized = true;
        this.initialization$ = undefined;
      }),

      shareReplay(1),
    );

    return this.initialization$;
  }

  /**
   * Guarda la sesión devuelta por el backend.
   */
  setSession(response: MeResponse): void {
    this.userState.set(response.data.user);

    this.restaurantsState.set(response.data.restaurants);

    const currentRestaurantId =
      this.activeRestaurantIdState();

    const currentRestaurantExists =
      response.data.restaurants.some(
        (restaurant) => restaurant.id === currentRestaurantId,
      );

    if (!currentRestaurantExists) {
      this.activeRestaurantIdState.set(
        response.data.restaurants[0]?.id ?? null,
      );
    }

    this.isAuthenticated.set(true);
    this.initialized = true;
  }

  /**
   * Selecciona una sede únicamente si pertenece
   * a las sedes disponibles en la sesión.
   */
  selectRestaurant(restaurantId: string): boolean {
    const allowedRestaurant = this.restaurantsState().some(
      (restaurant) => restaurant.id === restaurantId,
    );

    if (!allowedRestaurant) {
      return false;
    }

    this.activeRestaurantIdState.set(restaurantId);

    return true;
  }

  /**
   * Limpia los datos de la sesión.
   */
  clearSession(): void {
    this.userState.set(null);
    this.restaurantsState.set([]);
    this.activeRestaurantIdState.set(null);

    this.isAuthenticated.set(false);
  }

  /**
   * Permite volver a inicializar la sesión.
   */
  reset(): void {
    this.clearSession();

    this.initialized = false;
    this.initialization$ = undefined;
  }
}