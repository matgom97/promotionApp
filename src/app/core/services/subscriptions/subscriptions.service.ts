import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';

import {
  SubscriptionResponse
} from '../../models/subscription.model';

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
   * El backend debe implementar este endpoint y verificar
   * la membresía y los permisos del usuario.
   */
  getMyPendingSubscription(): Observable<SubscriptionResponse> {
    return this.api.get<SubscriptionResponse>(
      'subscriptions/me/pending'
    );
  }
}