export type PlanType = 'starter' | 'pro' | 'business';

export type BillingInterval = 'MONTH' | 'YEAR';

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;

  price: PlanPrice;

  billingInterval: BillingInterval;
  trialDays: number;

  limits: PlanLimits;

  requiresPayment: boolean;
  isFeatured: boolean;

  features: PlanFeature[];
}

export interface PlanFeature {
  code: string;
  name: string;
  description: string | null;
}

export interface PlanLimits {
  maxUsers: number | null;
  maxActivePromotions: number | null;
  maxRestaurants: number | null;
}

export interface PlanPrice {
  amount: number;
  currency: string;
}

export interface PlansResponse {
  data: Plan[];
}