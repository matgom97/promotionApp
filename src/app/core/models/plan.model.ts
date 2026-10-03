export type PlanType = 'starter' | 'pro' | 'business';

export interface Plan {
  code: string;
  name: string;
  description: string;

  price: PlanPrice;

  billingInterval: string;
  trialDays: number;

  limits: PlanLimits;

  requiresPayment: boolean;
  isFeatured: boolean;

  features: PlanFeature[];
}

export interface PlanFeature {
  code: string;
  name: string;
  description: string;
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