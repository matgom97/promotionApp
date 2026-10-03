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
  AuthService,
  MeResponse,
} from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private readonly userState =
    signal<MeResponse['data']['user'] | null>(null);

  private readonly restaurantState =
    signal<MeResponse['data']['restaurant'] | null>(null);

  private readonly membershipState =
    signal<MeResponse['data']['membership'] | null>(null);

  private initialized = false;

  private initialization$?: Observable<boolean>;

  readonly user = this.userState.asReadonly();
  readonly restaurant = this.restaurantState.asReadonly();
  readonly membership = this.membershipState.asReadonly();

  readonly isAuthenticated = signal(false);

  constructor(
    private readonly authService: AuthService,
  ) {}

  initialize(): Observable<boolean> {
    if (this.initialized) {
      return of(this.isAuthenticated());
    }

    if (this.initialization$) {
      return this.initialization$;
    }

    this.initialization$ =
      this.authService.me().pipe(
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

  setSession(response: MeResponse): void {
    this.userState.set(response.data.user);
    this.restaurantState.set(
      response.data.restaurant,
    );
    this.membershipState.set(
      response.data.membership,
    );

    this.isAuthenticated.set(true);
    this.initialized = true;
  }

  clearSession(): void {
    this.userState.set(null);
    this.restaurantState.set(null);
    this.membershipState.set(null);

    this.isAuthenticated.set(false);
  }

  reset(): void {
    this.clearSession();

    this.initialized = false;
    this.initialization$ = undefined;
  }
}