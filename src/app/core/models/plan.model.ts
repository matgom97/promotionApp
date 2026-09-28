export type PlanType = 'starter' | 'pro' | 'business';

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  period: string;
  requiresPaymentMethod: boolean;
}