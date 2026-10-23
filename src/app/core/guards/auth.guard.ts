import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';

import {
  catchError,
  map,
  of,
  switchMap,
} from 'rxjs';

import { AuthStateService } from '../services/auth/auth-state.service';
import { WorkspaceStateService } from '../services/workspace/workspace-state.service';

export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const workspaceState = inject(WorkspaceStateService);

  return authState.initialize().pipe(
    switchMap((isAuthenticated) => {
      if (!isAuthenticated) {
        return of(
          router.createUrlTree(['/auth/login']),
        );
      }

      return workspaceState.loadWorkspace().pipe(
        map(() => true),

        catchError((error: unknown) => {
  if (error instanceof HttpErrorResponse) {
    const errorCode = error.error?.code;
    const errorMessage = error.error?.message;

    if (
      error.status === 403 &&
      (
        errorCode === 'SUBSCRIPTION_REQUIRED' ||
        errorMessage ===
          'An active subscription is required to access this workspace.'
      )
    ) {
      return of(
        router.createUrlTree(['/auth/select-plan']),
      );
    }

    if (error.status === 401) {
      return of(
        router.createUrlTree(['/auth/login']),
      );
    }
  }

  console.error(
    'Error validando el acceso al workspace:',
    error,
  );

  return of(
    router.createUrlTree(['/auth/login']),
  );
}),
      );
    }),
  );
};