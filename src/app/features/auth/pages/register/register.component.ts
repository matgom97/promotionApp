import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

type PlanType = 'starter' | 'pro' | 'business';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;

  selectedPlan: PlanType = 'pro';

  planName = 'Pro';

  planDescription =
    '14 días de plan Pro sin tarjeta. Después puedes seguir en el plan gratuito.';

  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.registerForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],

      restaurantName: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],

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
          Validators.required,
          Validators.minLength(6)
        ]
      ],

      terms: [
        false,
        Validators.requiredTrue
      ]
    });

    this.route.queryParamMap.subscribe(params => {

      const plan = params.get('plan');

      if (
        plan === 'starter' ||
        plan === 'pro' ||
        plan === 'business'
      ) {
        this.selectedPlan = plan;
      } else {
        this.selectedPlan = 'starter';
      }

      this.updatePlanInformation();
    });
  }

  private updatePlanInformation(): void {

    switch (this.selectedPlan) {

      case 'starter':
        this.planName = 'Starter';

        this.planDescription =
          'Comienza gratis y crea tus primeras promociones para tu restaurante.';

        break;

      case 'pro':
        this.planName = 'Pro';

        this.planDescription =
          '14 días de prueba del plan Pro. Agrega tu tarjeta para comenzar.';

        break;

      case 'business':
        this.planName = 'Business';

        this.planDescription =
          'Activa el plan Business agregando una tarjeta para comenzar.';

        break;
    }
  }

  requiresPayment(): boolean {
    return this.selectedPlan !== 'starter';
  }

  submit(): void {

    if (this.registerForm.invalid) {

      this.registerForm.markAllAsTouched();

      return;

    }

    const registrationData = {

      ...this.registerForm.value,

      plan: this.selectedPlan

    };

    console.log('Registro:', registrationData);

    /*

     * PRO / BUSINESS

     *

     * Guardamos temporalmente la información necesaria

     * para demostrar que el usuario pasó por el registro.

     *

     * IMPORTANTE:

     * No guardamos password, tarjeta ni CVV.

     */

    if (this.requiresPayment()) {

      const pendingRegistration = {

        plan: this.selectedPlan,

        name: registrationData.name,

        restaurantName: registrationData.restaurantName,

        email: registrationData.email

      };

      sessionStorage.setItem(

        'pending_registration',

        JSON.stringify(pendingRegistration)

      );

      this.router.navigate(

        ['/auth/subscription'],

        {

          queryParams: {

            plan: this.selectedPlan

          }

        }

      );

      return;

    }

    /*

     * STARTER

     *

     * Por ahora simulamos continuar al dashboard.

     * Posteriormente aquí se hará el registro real

     * contra Laravel.

     */

    this.router.navigate(['/app/dashboard']);

  }


}