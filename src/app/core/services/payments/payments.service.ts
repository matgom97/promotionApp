import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';

export interface PaymentMethod {
  id: string;
  type: 'CARD';
  status: 'ACTIVE' | 'INACTIVE';
  brand: string | null;
  lastFour: string | null;
  providerPaymentSourceId: string;
  createdAt: string;
}

export interface PaymentMethodResponse {
  data: PaymentMethod;
}

export interface CreatePaymentTransactionRequest {
  subscriptionId: string;
  paymentMethodId: string;
  installments: number;
  sessionId: string;
}

export interface CreatePaymentTransactionResponse {
  data: {
    payment: {
      id: string;
      reference: string;
      amount: string;
      currency: string;
      status: string;
    };
    transaction: {
      id: string;
      status: string;
      reference: string;
    };
  };
}

export interface WompiAcceptanceTokens {
  acceptanceToken: string;
  acceptancePermalink: string;
  personalDataAuthToken: string;
  personalDataAuthPermalink: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  constructor(
    private readonly api: ApiService,
  ) {}

  getAcceptanceTokens(): Observable<{
    data: WompiAcceptanceTokens;
  }> {
    return this.api.get(
      'payments/wompi/acceptance-tokens',
    );
  }

  createPaymentMethod(
    request: {
      token: string;
      sessionId: string;
      subscriptionId: string;
      acceptanceToken: string;
      personalDataAuthToken: string;
    },
  ): Observable<PaymentMethodResponse> {
    return this.api.post(
      'payments/payment-method',
      request,
    );
  }

  createTransaction(
    request: CreatePaymentTransactionRequest,
  ): Observable<CreatePaymentTransactionResponse> {
    return this.api.post(
      'payments/transaction',
      request,
    );
  }
}