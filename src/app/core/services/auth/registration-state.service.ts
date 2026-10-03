import { Injectable } from '@angular/core';

export type PlanCode = 'starter' | 'pro' | 'business';

@Injectable({
  providedIn: 'root'
})
export class RegistrationStateService {

  private selectedPlan: PlanCode | null = null;
  private subscriptionId: string | null = null;

  setSelectedPlan(planCode: PlanCode): void {
    this.selectedPlan = planCode;
  }

  getSelectedPlan(): PlanCode | null {
    return this.selectedPlan;
  }

  setSubscriptionId(subscriptionId: string): void {
    this.subscriptionId = subscriptionId;
  }

  getSubscriptionId(): string | null {
    return this.subscriptionId;
  }

  clear(): void {
    this.selectedPlan = null;
    this.subscriptionId = null;
  }
}