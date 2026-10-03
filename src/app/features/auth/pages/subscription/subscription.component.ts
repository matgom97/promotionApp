import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';

import {
  EMPTY,
  Subject,
  interval,
} from 'rxjs';

import {
  catchError,
  switchMap,
  take,
  takeUntil,
  takeWhile,
} from 'rxjs/operators';

import { RegistrationStateService } from '../../../../core/services/auth/registration-state.service';

import { SubscriptionsService } from '../../../../core/services/subscriptions/subscriptions.service';

import { PaymentsService } from '../../../../core/services/payments/payments.service';

import { WompiService } from '../../../../core/services/payments/wompi.service';

import { WompiTokenizationService } from '../../../../core/services/wompi/wompi-tokenization.service';

import { Subscription } from '../../../../core/models/subscription.model';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
  ],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss',
})
export class SubscriptionComponent
  implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('wompiForm', { static: false })
  private wompiForm?: ElementRef<HTMLFormElement>;

  private readonly destroy$ =
    new Subject<void>();

  private pollingStarted =
    false;

  private redirectTimeoutId?: ReturnType<typeof setTimeout>;

  /**
   * Indica que la página fue abierta
   * después de que Wompi procesó el formulario.
   *
   * En este estado NO debemos volver a
   * inicializar el widget.
   */
  isPaymentReturn =
    false;

  subscription:
    Subscription | null = null;

  subscriptionId:
    string | null = null;

  sessionId:
    string | null = null;

  acceptanceToken:
    string | null = null;

  acceptancePermalink:
    string | null = null;

  personalDataAuthToken:
    string | null = null;

  personalDataAuthPermalink:
    string | null = null;

  wompiTermsAccepted =
    false;

  personalDataAccepted =
    false;

  isLoading =
    true;

  isProcessing =
    false;

  isWaitingForPayment =
    false;

  paymentStatus:
    | 'IDLE'
    | 'PENDING'
    | 'APPROVED'
    | 'DECLINED'
    | 'ERROR' =
    'IDLE';

  errorMessage =
    '';

  private widgetInitialized =
    false;

  constructor(
    private readonly registrationState:
      RegistrationStateService,

    private readonly subscriptionsService:
      SubscriptionsService,

    private readonly paymentsService:
      PaymentsService,

    private readonly wompiService:
      WompiService,

    private readonly wompiTokenizationService:
      WompiTokenizationService,

    private readonly router:
      Router,

    private readonly activatedRoute:
      ActivatedRoute,
  ) {}

  // ==========================================
  // INIT
  // ==========================================

  ngOnInit(): void {

    this.activatedRoute
      .queryParamMap
      .pipe(
        take(1),
      )
      .subscribe((params) => {

        const payment =
          params.get('payment');

        const returnedSubscriptionId =
          params.get('subscriptionId');

        /*
         * ========================================
         * REGRESO DESDE WOMPI
         * ========================================
         *
         * El subscriptionId de la URL tiene
         * prioridad absoluta.
         *
         * Esto permite recuperar el flujo aunque
         * RegistrationStateService haya perdido
         * su estado después del redirect.
         */

        if (
          payment === 'processing' &&
          returnedSubscriptionId
        ) {

          this.isPaymentReturn =
            true;

          this.subscriptionId =
            returnedSubscriptionId;

          /*
           * También actualizamos el estado
           * temporal por compatibilidad con
           * el resto del flujo.
           */
          this.registrationState
            .setSubscriptionId(
              returnedSubscriptionId,
            );

          this.paymentStatus =
            'PENDING';

          this.isProcessing =
            true;

          this.isWaitingForPayment =
            true;

          /*
           * NO inicializamos Wompi.
           *
           * El pago ya fue enviado.
           *
           * Ahora solamente esperamos al webhook.
           */

          this.loadSubscription();

          return;
        }

        /*
         * ========================================
         * FLUJO NORMAL
         * ========================================
         *
         * En una primera entrada a la pantalla
         * todavía podemos utilizar el estado de
         * registro.
         */

        const storedSubscriptionId =
          this.registrationState
            .getSubscriptionId();

        if (!storedSubscriptionId) {

          /*
           * No tenemos una suscripción válida
           * para esta pantalla.
           */
          this.isLoading =
            false;

          this.router.navigate([
            '/auth/register',
          ]);

          return;
        }

        this.subscriptionId =
          storedSubscriptionId;

        this.initializePaymentPage();

      });

  }

  ngAfterViewInit(): void {
    /*
     * La inicialización del widget se dispara
     * desde initializeSession/loadAcceptanceTokens
     * cuando los datos estén disponibles.
     */
  }

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();

    if (this.redirectTimeoutId) {
      clearTimeout(
        this.redirectTimeoutId,
      );
    }

  }

  // ==========================================
  // NORMAL PAYMENT PAGE
  // ==========================================

  private initializePaymentPage(): void {

    this.isLoading =
      true;

    this.initializeSession();

    this.loadSubscription();

    this.loadAcceptanceTokens();

  }

  // ==========================================
  // LOAD SUBSCRIPTION
  // ==========================================

  private loadSubscription(): void {

    if (!this.subscriptionId) {

      this.isLoading =
        false;

      return;
    }

    this.subscriptionsService
      .getSubscription(
        this.subscriptionId,
      )
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe({

        next: (
          response,
        ) => {

          this.subscription =
            response.data;

          this.isLoading =
            false;

          const status =
            response.data.status;

          /*
           * ======================================
           * SUSCRIPCIÓN YA ACTIVA
           * ======================================
           *
           * Puede ocurrir que el webhook haya
           * procesado el pago antes de que Angular
           * haga esta consulta.
           */

          if (
            status === 'ACTIVE'
          ) {

            this.handlePaymentApproved();

            return;
          }

          /*
           * ======================================
           * PAGO PENDIENTE
           * ======================================
           *
           * Si venimos de Wompi comenzamos
           * inmediatamente el polling.
           */

          if (
            this.isPaymentReturn &&
            (
              status === 'PENDING' ||
              status === 'TRIALING'
            )
          ) {

            this.startPaymentPolling();

            return;
          }

          /*
           * ======================================
           * SUSCRIPCIÓN NO ACTIVA
           * ======================================
           *
           * Para el flujo normal dejamos disponible
           * el formulario de Wompi.
           */

          if (
            status === 'CANCELED' ||
            status === 'EXPIRED'
          ) {

            this.paymentStatus =
              'DECLINED';

            this.isProcessing =
              false;

            this.isWaitingForPayment =
              false;

            this.errorMessage =
              'La suscripción no está disponible para realizar el pago.';

          }

        },

        error: (
          error: unknown,
        ) => {

          console.error(
            'Error cargando suscripción:',
            error,
          );

          this.isLoading =
            false;

          this.isProcessing =
            false;

          this.isWaitingForPayment =
            false;

          this.paymentStatus =
            'ERROR';

          this.errorMessage =
            'No fue posible consultar el estado de la suscripción.';

        },

      });

  }

  // ==========================================
  // WOMPI SESSION
  // ==========================================

  private initializeSession(): void {

    this.wompiService
      .initializeSession()
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe({

        next: (
          sessionId: string,
        ) => {

          this.sessionId =
            sessionId;

          this.tryInitializeWidget();

        },

        error: (
          error: unknown,
        ) => {

          console.error(
            'Error inicializando Wompi:',
            error,
          );

          this.errorMessage =
            'No fue posible inicializar el sistema de pagos.';

        },

      });

  }

  // ==========================================
  // ACCEPTANCE TOKENS
  // ==========================================

  private loadAcceptanceTokens(): void {

    this.paymentsService
      .getAcceptanceTokens()
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe({

        next: (
          response,
        ) => {

          const data =
            response.data;

          this.acceptanceToken =
            data.acceptanceToken;

          this.acceptancePermalink =
            data.acceptancePermalink;

          this.personalDataAuthToken =
            data.personalDataAuthToken;

          this.personalDataAuthPermalink =
            data.personalDataAuthPermalink;

          this.tryInitializeWidget();

        },

        error: (
          error: unknown,
        ) => {

          console.error(
            'Error obteniendo tokens de aceptación:',
            error,
          );

          this.errorMessage =
            'No fue posible preparar los términos del pago.';

        },

      });

  }

  // ==========================================
  // WOMPI WIDGET
  // ==========================================

  private tryInitializeWidget(): void {

    /*
     * Si regresamos de Wompi NO debemos
     * crear nuevamente el widget.
     */

    if (
      this.isPaymentReturn
    ) {

      return;
    }

    if (
      this.widgetInitialized ||
      !this.sessionId ||
      !this.acceptanceToken ||
      !this.personalDataAuthToken
    ) {

      return;
    }

    if (!this.wompiForm) {

      setTimeout(() => {

        this.tryInitializeWidget();

      });

      return;
    }

    this.initializeTokenizationWidget();

  }

  private async initializeTokenizationWidget(): Promise<void> {

    if (
      this.widgetInitialized ||
      !this.wompiForm ||
      this.isPaymentReturn
    ) {

      return;
    }

    try {

      await this.wompiTokenizationService
        .loadWidget();

      const form =
        this.wompiForm.nativeElement;

      const existingScript =
        form.querySelector(
          'script[data-widget-operation="tokenize"]',
        );

      if (existingScript) {

        this.widgetInitialized =
          true;

        return;
      }

      if (!this.subscriptionId) {

        this.errorMessage =
          'No se encontró la suscripción asociada al pago.';

        return;
      }

      this.addHiddenInput(
        form,
        'subscriptionId',
        this.subscriptionId,
      );

      this.addHiddenInput(
        form,
        'sessionId',
        this.sessionId!,
      );

      const script =
        document.createElement(
          'script',
        );

      script.src =
        'https://checkout.wompi.co/widget.js';

      script.async =
        true;

      script.setAttribute(
        'data-render',
        'button',
      );

      script.setAttribute(
        'data-widget-operation',
        'tokenize',
      );

      script.setAttribute(
        'data-public-key',
        this.wompiTokenizationService
          .getPublicKey(),
      );

      form.appendChild(
        script,
      );

      this.widgetInitialized =
        true;

    } catch (
      error: unknown
    ) {

      console.error(
        'Error inicializando Widget Wompi:',
        error,
      );

      this.errorMessage =
        'No fue posible cargar el formulario seguro de Wompi.';

    }

  }

  private addHiddenInput(
    form: HTMLFormElement,
    name: string,
    value: string,
  ): void {

    const existing =
      form.querySelector(
        `input[name="${name}"]`,
      );

    if (existing) {

      existing.setAttribute(
        'value',
        value,
      );

      return;
    }

    const input =
      document.createElement(
        'input',
      );

    input.type =
      'hidden';

    input.name =
      name;

    input.value =
      value;

    form.appendChild(
      input,
    );

  }

  // ==========================================
  // PAYMENT
  // ==========================================

  canStartPayment(): boolean {

    return !!this.subscriptionId &&
      !!this.sessionId &&
      !!this.acceptanceToken &&
      !!this.personalDataAuthToken &&
      this.wompiTermsAccepted &&
      this.personalDataAccepted &&
      !this.isProcessing &&
      !this.isWaitingForPayment;

  }

  continueToPayment(): void {

    this.errorMessage =
      '';

    if (
      !this.wompiTermsAccepted
    ) {

      this.errorMessage =
        'Debes aceptar los términos y condiciones de Wompi.';

      return;
    }

    if (
      !this.personalDataAccepted
    ) {

      this.errorMessage =
        'Debes aceptar la autorización de tratamiento de datos personales.';

      return;
    }

    if (!this.sessionId) {

      this.errorMessage =
        'La sesión de pago todavía no está disponible.';

      return;
    }

    if (!this.acceptanceToken) {

      this.errorMessage =
        'No se obtuvo el token de aceptación de Wompi.';

      return;
    }

    if (
      !this.personalDataAuthToken
    ) {

      this.errorMessage =
        'No se obtuvo la autorización de datos personales de Wompi.';

      return;
    }

    this.isProcessing =
      true;

  }

  // ==========================================
  // WOMPI SUBMIT
  // ==========================================

  onWompiSubmit(
    event: Event,
  ): void {

    if (!this.canStartPayment()) {

      event.preventDefault();

      this.errorMessage =
        'Completa y acepta los datos requeridos antes de continuar.';

      return;
    }

    this.errorMessage =
      '';

    this.isProcessing =
      true;

    this.isWaitingForPayment =
      true;

    this.paymentStatus =
      'PENDING';

  }

  // ==========================================
  // PAYMENT POLLING
  // ==========================================

  private startPaymentPolling(): void {

    if (
      !this.subscriptionId ||
      this.pollingStarted
    ) {

      return;
    }

    this.pollingStarted =
      true;

    this.isPaymentReturn =
      true;

    this.isWaitingForPayment =
      true;

    this.isProcessing =
      true;

    this.paymentStatus =
      'PENDING';

    /*
     * Primera consulta inmediata.
     *
     * Después consultamos cada 2 segundos.
     *
     * Máximo:
     * 30 consultas.
     */

    this.subscriptionsService
      .getSubscription(
        this.subscriptionId,
      )
      .pipe(
        catchError(
          (
            error: unknown,
          ) => {

            console.error(
              'Error en consulta inicial del pago:',
              error,
            );

            this.handlePollingError();

            return EMPTY;
          },
        ),

        switchMap((
          response,
        ) => {

          this.updateSubscriptionFromPolling(
            response.data,
          );

          /*
           * Si ya está activa no necesitamos
           * crear el interval.
           */

          if (
            response.data.status === 'ACTIVE'
          ) {

            this.handlePaymentApproved();

            return EMPTY;
          }

          return interval(2000).pipe(
            switchMap(() =>
              this.subscriptionsService
                .getSubscription(
                  this.subscriptionId!,
                ),
            ),
            take(30),
            takeWhile(
              (
                response,
              ) => {

                const status =
                  response.data.status;

                return (
                  status === 'PENDING' ||
                  status === 'TRIALING'
                );

              },
              true,
            ),
          );

        }),

        takeUntil(
          this.destroy$,
        ),

        catchError(
          (
            error: unknown,
          ) => {

            console.error(
              'Error consultando estado de suscripción:',
              error,
            );

            this.handlePollingError();

            return EMPTY;
          },
        ),

      )
      .subscribe({

        next: (
          response,
        ) => {

          this.updateSubscriptionFromPolling(
            response.data,
          );

          const status =
            response.data.status;

          if (
            status === 'ACTIVE'
          ) {

            this.handlePaymentApproved();

            return;
          }

          if (
            status === 'CANCELED' ||
            status === 'EXPIRED'
          ) {

            this.paymentStatus =
              'DECLINED';

            this.isWaitingForPayment =
              false;

            this.isProcessing =
              false;

            this.errorMessage =
              'El pago no pudo ser confirmado. Puedes intentar nuevamente.';

          }

        },

        complete: () => {

          /*
           * Si ya fue aprobado no hacemos nada.
           */

          if (
            this.paymentStatus ===
            'APPROVED'
          ) {

            return;
          }

          /*
           * Si sigue pendiente después del
           * tiempo máximo, dejamos el estado
           * visible al usuario.
           */

          if (
            this.subscription?.status ===
              'PENDING' ||
            this.subscription?.status ===
              'TRIALING'
          ) {

            this.isWaitingForPayment =
              false;

            this.isProcessing =
              false;

            this.paymentStatus =
              'PENDING';

            this.errorMessage =
              'El pago todavía está siendo procesado. Puedes consultar nuevamente en unos momentos.';

          }

        },

      });

  }

  private updateSubscriptionFromPolling(
    subscription: Subscription,
  ): void {

    this.subscription =
      subscription;

  }

  private handlePollingError(): void {

    this.paymentStatus =
      'ERROR';

    this.isWaitingForPayment =
      false;

    this.isProcessing =
      false;

    this.errorMessage =
      'No fue posible consultar el estado del pago.';

  }

  // ==========================================
  // PAYMENT APPROVED
  // ==========================================

  private handlePaymentApproved(): void {

    /*
     * Evitamos ejecutar la navegación más
     * de una vez.
     */

    if (
      this.paymentStatus ===
      'APPROVED'
    ) {

      return;
    }

    this.paymentStatus =
      'APPROVED';

    this.isWaitingForPayment =
      false;

    this.isProcessing =
      false;

    /*
     * El estado temporal del registro ya no
     * es necesario.
     */

    this.registrationState.clear();

    /*
     * IMPORTANTE:
     *
     * La ruta protegida de tu aplicación es:
     *
     * /app/dashboard
     *
     * NO:
     *
     * /dashboard
     */

    this.redirectTimeoutId =
      setTimeout(() => {

        this.router.navigate([
          '/app/dashboard',
        ]);

      }, 1000);

  }

  // ==========================================
  // FORMATTERS
  // ==========================================

  get formattedPrice(): string {

    if (
      !this.subscription?.plan?.priceAmount
    ) {

      return '$0';

    }

    const amount =
      Number(
        this.subscription
          .plan
          .priceAmount,
      );

    return new Intl.NumberFormat(
      'es-CO',
      {
        style:
          'currency',

        currency:
          this.subscription
            .plan
            .currency ||
          'COP',

        maximumFractionDigits:
          0,
      },
    ).format(
      amount,
    );

  }

  get planName(): string {

    return this.subscription
      ?.plan
      ?.name ||
      'Plan';

  }

  get billingInterval(): string {

    if (
      this.subscription
        ?.plan
        ?.billingInterval ===
      'YEAR'
    ) {

      return 'año';

    }

    return 'mes';

  }

  get isPaymentReady(): boolean {

    return !!this.sessionId &&
      !!this.acceptanceToken &&
      !!this.personalDataAuthToken;

  }

  get paymentMessage(): string {

    switch (
      this.paymentStatus
    ) {

      case 'PENDING':

        return 'Estamos verificando tu pago con Wompi. No cierres esta ventana.';

      case 'APPROVED':

        return 'Pago aprobado. Activando tu suscripción...';

      case 'DECLINED':

        return 'El pago fue rechazado. Puedes intentar nuevamente.';

      case 'ERROR':

        return 'Ocurrió un error procesando el pago.';

      default:

        return '';

    }

  }

}