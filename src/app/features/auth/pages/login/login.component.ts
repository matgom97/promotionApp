import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  AuthService,
  LoginRequest
} from '../../../../core/services/auth/auth.service';

import {
  AuthStateService
} from '../../../../core/services/auth/auth-state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;

  isSubmitting = false;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authState = inject(AuthStateService);

  ngOnInit(): void {

    this.loginForm = this.fb.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required
        ]
      ],

      remember: [
        false
      ]

    });
  }

  submit(): void {

    if (this.isSubmitting) {
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const payload: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(payload).subscribe({

      next: () => {

        /*
         * El backend ya creó las cookies HttpOnly.
         *
         * Ahora recuperamos el usuario mediante /auth/me
         * y lo almacenamos únicamente en memoria.
         */
        this.authState.reset();

        this.authState.initialize().subscribe({

          next: (authenticated) => {

            if (!authenticated) {
              this.isSubmitting = false;
              return;
            }

            this.router.navigate([
              '/app/dashboard'
            ]);
          },

          error: () => {
            this.isSubmitting = false;
          }

        });
      },

      error: (error) => {

        console.error(
          'Error iniciando sesión:',
          error
        );

        this.isSubmitting = false;
      }

    });
  }
}