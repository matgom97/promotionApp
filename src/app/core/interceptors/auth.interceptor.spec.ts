import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';

import { inject } from '@angular/core';

import { Router } from '@angular/router';

import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
} from 'rxjs';

import { AuthService } from '../services/auth/auth.service';

import { AuthStateService } from '../services/auth/auth-state.service';

let isRefreshing = false;

const refreshTokenSubject =
  new BehaviorSubject<boolean | null>(null);

export const authRefreshInterceptor: HttpInterceptorFn = (
  request,
  next,
) => {

  const authService =
    inject(AuthService);

  const authState =
    inject(AuthStateService);

  const router =
    inject(Router);

  return next(request).pipe(

    catchError(
      (error: HttpErrorResponse) => {

        if (error.status !== 401) {

          return throwError(
            () => error,
          );

        }

        /*
         * Nunca intentamos refrescar el propio
         * endpoint de refresh.
         */

        if (
          request.url.includes(
            '/auth/refresh',
          )
        ) {

          handleSessionExpired(
            authState,
            router,
          );

          return throwError(
            () => error,
          );

        }

        /*
         * Si ya existe un refresh en progreso,
         * esperamos a que termine.
         */

        if (isRefreshing) {

          return refreshTokenSubject.pipe(

            filter(
              (refreshed) =>
                refreshed !== null,
            ),

            take(1),

            switchMap(
              (refreshed) => {

                if (!refreshed) {

                  return throwError(
                    () => error,
                  );

                }

                /*
                 * Las cookies HttpOnly ya fueron
                 * actualizadas por el backend.
                 */

                return next(request);

              },
            ),

          );

        }

        /*
         * Primer request que detecta el 401.
         */

        isRefreshing =
          true;

        refreshTokenSubject.next(
          null,
        );

        return authService
          .refresh()
          .pipe(

            switchMap(() => {

              isRefreshing =
                false;

              refreshTokenSubject.next(
                true,
              );

              /*
               * El backend ya actualizó las
               * cookies HttpOnly.
               *
               * Reintentamos la petición original.
               */

              return next(request);

            }),

            catchError(
              (
                refreshError,
              ) => {

                isRefreshing =
                  false;

                refreshTokenSubject.next(
                  false,
                );

                handleSessionExpired(
                  authState,
                  router,
                );

                return throwError(
                  () => refreshError,
                );

              },
            ),

          );

      },
    ),

  );
};

function handleSessionExpired(
  authState: AuthStateService,
  router: Router,
): void {

  authState.reset();

  router.navigate([
    '/auth/login',
  ]);

}