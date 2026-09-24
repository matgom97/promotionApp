export type PlanType = 'starter' | 'pro' | 'business';

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  price: number;
  period: string;
}