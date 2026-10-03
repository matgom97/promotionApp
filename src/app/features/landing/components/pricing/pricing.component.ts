import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { RegistrationStateService } from '../../../../core/services/auth/registration-state.service';
import { PlansService } from '../../../../core/services/plans/plans.service';
import { Plan } from '../../../../core/models/plan.model';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [
    DecimalPipe
  ],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss'
})
export class PricingComponent implements OnInit {

  plans: Plan[] = [];

  isLoading = true;
  hasError = false;

  constructor(
    private readonly router: Router,
    private readonly plansService: PlansService,
    private readonly registrationState: RegistrationStateService
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  private loadPlans(): void {
    this.isLoading = true;
    this.hasError = false;

    this.plansService.getPlans().subscribe({
      next: (response) => {
        this.plans = response.data;
        this.isLoading = false;
      },

      error: (error) => {
        console.error('Error cargando los planes:', error);

        this.hasError = true;
        this.isLoading = false;
      }
    });
  }

  selectPlan(planCode: string): void {
    if (
      planCode !== 'starter' &&
      planCode !== 'pro' &&
      planCode !== 'business'
    ) {
      return;
    }

    this.registrationState.setSelectedPlan(planCode);

    this.router.navigate(['/auth/register']);
  }
}