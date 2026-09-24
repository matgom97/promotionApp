import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

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
    private route: ActivatedRoute
  ) {}

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
        this.selectedPlan = 'pro';
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
          '14 días de plan Pro sin tarjeta. Después puedes seguir en el plan gratuito.';

        break;

      case 'business':
        this.planName = 'Business';

        this.planDescription =
          'Gestiona múltiples restaurantes y equipos desde una misma plataforma.';

        break;
    }
  }

  submit(): void {

    if (this.registerForm.invalid) {

      this.registerForm.markAllAsTouched();

      return;
    }

    const payload = {
      ...this.registerForm.value,
      plan: this.selectedPlan
    };

    console.log('Registro:', payload);

    // Aquí posteriormente llamaremos al backend.
  }
}