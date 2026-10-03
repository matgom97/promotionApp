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

  getSubscription(
    subscriptionId: string
  ): Observable<SubscriptionResponse> {

    return this.api.get<SubscriptionResponse>(
      `subscriptions/${subscriptionId}`
    );

  }

}