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

export interface PaymentAuthorizationResponse {
  data: {
    authorizationToken: string;
    expiresInSeconds: number;
  };
}

export type PaymentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'VOIDED'
  | 'ERROR';

export interface LatestSubscriptionPayment {
  id: string;
  reference: string;
  status: PaymentStatus;
  amount: string;
  currency: string;
  createdAt: string;
  paidAt: string | null;
}

export interface LatestSubscriptionPaymentResponse {
  data: LatestSubscriptionPayment | null;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  constructor(
    private readonly api: ApiService,
  ) {}

  /**
   * Obtiene los tokens de aceptación de Wompi.
   */
  getAcceptanceTokens(): Observable<WompiAcceptanceTokens> {
    return this.api.get<WompiAcceptanceTokens>(
      'payments/wompi/acceptance-tokens',
    );
  }

  /**
   * Solicita autorización temporal para pagar una suscripción.
   */
  authorizePayment(
    subscriptionId: string,
  ): Observable<PaymentAuthorizationResponse> {
    return this.api.post<PaymentAuthorizationResponse>(
      'payments/wompi/authorization',
      {
        subscriptionId,
      },
    );
  }

  /**
   * Registra un método de pago.
   */
  createPaymentMethod(
    request: {
      token: string;
      sessionId: string;
      subscriptionId: string;
      acceptanceToken: string;
      personalDataAuthToken: string;
    },
  ): Observable<PaymentMethodResponse> {
    return this.api.post<PaymentMethodResponse>(
      'payments/payment-method',
      request,
    );
  }

  /**
   * Crea una transacción con un método de pago registrado.
   */
  createTransaction(
    request: CreatePaymentTransactionRequest,
  ): Observable<CreatePaymentTransactionResponse> {
    return this.api.post<CreatePaymentTransactionResponse>(
      'payments/transaction',
      request,
    );
  }

  /**
   * Consulta el pago más reciente de una suscripción.
   *
   * Endpoint existente en NestJS:
   * GET /api/v1/payments/subscription/:subscriptionId/latest
   */
  getLatestSubscriptionPayment(
    subscriptionId: string,
  ): Observable<LatestSubscriptionPaymentResponse> {
    return this.api.get<LatestSubscriptionPaymentResponse>(
      `payments/subscription/${encodeURIComponent(subscriptionId)}/latest`,
    );
  }
}