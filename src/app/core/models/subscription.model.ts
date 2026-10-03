export type SubscriptionStatus =
  | 'PENDING'
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'EXPIRED';


export type BillingInterval =
  | 'MONTH'
  | 'YEAR';


export interface SubscriptionFeature {
  code: string;
  name: string;
  description: string | null;
}


export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceAmount: string;
  currency: string;
  billingInterval: BillingInterval;
  trialDays: number;
  requiresPayment: boolean;
  features: SubscriptionFeature[];
}


export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  startsAt: string;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  plan: SubscriptionPlan;
}


export interface SubscriptionResponse {
  data: Subscription;
}