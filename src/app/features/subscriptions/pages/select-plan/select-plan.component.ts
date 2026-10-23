import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  Plan,
  PlansResponse
} from '../../../../core/models/plan.model';

import { PlansService } from '../../../../core/services/plans/plans.service';
import { SubscriptionsService } from '../../../../core/services/subscriptions/subscriptions.service';

@Component({
  selector: 'app-select-plan',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './select-plan.component.html',
  styleUrl: './select-plan.component.scss'
})
export class SelectPlanComponent implements OnInit {

  private readonly plansService = inject(PlansService);
  private readonly subscriptionsService = inject(SubscriptionsService);
  private readonly router = inject(Router);

  plans: Plan[] = [];

  isLoading = true;
  isSubmitting = false;

  selectedPlanId: string | null = null;

  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.plansService
      .getPlans()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response: PlansResponse) => {
          this.plans = response.data ?? [];

          if (this.plans.length === 0) {
            this.errorMessage =
              'Actualmente no hay planes disponibles.';
          }
        },
        error: (error) => {
          console.error('Error loading plans:', error);

          this.errorMessage =
            'No fue posible cargar los planes. Intenta nuevamente.';
        }
      });
  }

  selectPlan(plan: Plan): void {
    if (this.isSubmitting) {
      return;
    }

    if (!plan.id) {
      this.errorMessage =
        'Este plan no tiene un identificador válido. Contacta al administrador.';
      return;
    }

    this.selectedPlanId = plan.id;
    this.errorMessage = null;
  }

  continueToCheckout(): void {
    if (!this.selectedPlanId || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    this.subscriptionsService
      .createForSelectedPlan(this.selectedPlanId)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => {
          const subscriptionId = response.data.id;

          void this.router.navigate(
            ['/auth/subscription'],
            {
              queryParams: {
                subscriptionId
              }
            }
          );
        },
        error: (error) => {
          console.error('Error creating subscription:', error);

          this.errorMessage =
            error?.error?.message ??
            'No fue posible iniciar la contratación. Intenta nuevamente.';
        }
      });
  }

  formatBillingInterval(interval: string): string {
    switch (interval) {
      case 'YEAR':
        return 'año';

      case 'MONTH':
      default:
        return 'mes';
    }
  }

  trackByPlanId(_index: number, plan: Plan): string {
    return plan.id;
  }
}