import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';

import {
  inject,
} from '@angular/core';

import {
  Router,
} from '@angular/router';

import {
  catchError,
  switchMap,
  throwError,
} from 'rxjs';

import {
  AuthService,
} from '../services/auth/auth.service';

import {
  AuthStateService,
} from '../services/auth/auth-state.service';

let isRefreshing = false;

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

  return next(
    request,
  ).pipe(

    catchError(
      (
        error: HttpErrorResponse,
      ) => {

        /*
         * Solo nos interesa recuperar
         * sesiones cuando el backend
         * responde 401.
         */

        if (
          error.status !== 401
        ) {

          return throwError(
            () => error,
          );

        }

        /*
         * Nunca intentamos refrescar
         * el propio endpoint de refresh.
         */

        if (
          request.url.includes(
            '/auth/refresh',
          )
        ) {

          authState.reset();

          router.navigate([
            '/auth/login',
          ]);

          return throwError(
            () => error,
          );

        }

        /*
         * Evitamos múltiples refresh
         * simultáneos.
         */

        if (isRefreshing) {

          authState.reset();

          router.navigate([
            '/auth/login',
          ]);

          return throwError(
            () => error,
          );

        }

        isRefreshing = true;

        return authService
          .refresh()
          .pipe(

            switchMap(() => {

              isRefreshing =
                false;

              /*
               * Las cookies HttpOnly fueron
               * actualizadas por el backend.
               *
               * No necesitamos modificar
               * headers ni tokens manualmente.
               */

              return next(
                request,
              );

            }),

            catchError(
              (
                refreshError,
              ) => {

                isRefreshing =
                  false;

                authState.reset();

                router.navigate([
                  '/auth/login',
                ]);

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