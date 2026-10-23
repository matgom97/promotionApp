import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';

import {
  SubscriptionResponse,
  SubscriptionStatus
} from '../../models/subscription.model';

export interface CreateSubscriptionResponse {
  message: string;
  data: {
    id: string;
    status: SubscriptionStatus;
    reused: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionsService {

  constructor(
    private readonly api: ApiService
  ) {}

  /**
   * Consulta una suscripción específica.
   */
  getSubscription(
    subscriptionId: string
  ): Observable<SubscriptionResponse> {
    return this.api.get<SubscriptionResponse>(
      `subscriptions/${subscriptionId}`
    );
  }

  /**
   * Recupera la suscripción pendiente del usuario autenticado.
   */
  getMyPendingSubscription(): Observable<SubscriptionResponse> {
    return this.api.get<SubscriptionResponse>(
      'subscriptions/me/pending'
    );
  }

  /**
   * Crea o recupera una suscripción pendiente para el plan seleccionado.
   */
  createForSelectedPlan(
    planId: string
  ): Observable<CreateSubscriptionResponse> {
    return this.api.post<CreateSubscriptionResponse>(
      'subscriptions',
      { planId }
    );
  }
}