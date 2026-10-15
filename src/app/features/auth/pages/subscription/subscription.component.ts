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
  throwError,
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

import {
  PaymentsService,
  WompiAcceptanceTokens,
} from '../../../../core/services/payments/payments.service';

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


  private paymentResponseReceived = false;

private paymentResponseTimeoutId?: ReturnType<typeof setTimeout>;

  @ViewChild('wompiForm', { static: false })
  private wompiForm?: ElementRef<HTMLFormElement>;

  private readonly destroy$ = new Subject<void>();

  private pollingStarted = false;

  private widgetInitializing = false;

  private redirectTimeoutId?: ReturnType<typeof setTimeout>;

  private widgetRetryTimeoutId?: ReturnType<typeof setTimeout>;

  private viewInitialized = false;

  isPaymentReturn = false;

  subscription: Subscription | null = null;

  subscriptionId: string | null = null;

  sessionId: string | null = null;

  acceptanceToken: string | null = null;

  acceptancePermalink: string | null = null;

  personalDataAuthToken: string | null = null;

  personalDataAuthPermalink: string | null = null;

  paymentAuthorizationToken: string | null = null;

  wompiTermsAccepted = false;

  personalDataAccepted = false;

  isLoading = true;

  isProcessing = false;

  isWaitingForPayment = false;

  paymentStatus:
    | 'IDLE'
    | 'PENDING'
    | 'APPROVED'
    | 'DECLINED'
    | 'ERROR' = 'IDLE';

  errorMessage = '';

  private widgetInitialized = false;

  constructor(
    private readonly registrationState: RegistrationStateService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly paymentsService: PaymentsService,
    private readonly wompiService: WompiService,
    private readonly wompiTokenizationService: WompiTokenizationService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
  ) {}

  // ==========================================
  // INIT
  // ==========================================

  ngOnInit(): void {
    this.activatedRoute.queryParamMap
      .pipe(
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe((params) => {
        const payment = params.get('payment');

        const returnedSubscriptionId =
          params.get('subscriptionId');

        /*
         * Regreso desde Wompi.
         * No volvemos a inicializar el widget.
         */
        if (
          payment === 'processing' &&
          returnedSubscriptionId
        ) {
          this.isPaymentReturn = true;

          this.subscriptionId =
            returnedSubscriptionId;

          this.registrationState.setSubscriptionId(
            returnedSubscriptionId,
          );

          this.paymentStatus = 'PENDING';
          this.isProcessing = true;
          this.isWaitingForPayment = true;

          this.loadSubscription();

          return;
        }

        /*
         * Flujo de registro o recuperación después
         * de iniciar sesión.
         */
        const storedSubscriptionId =
          this.registrationState.getSubscriptionId();

        if (storedSubscriptionId) {
          this.subscriptionId = storedSubscriptionId;

          this.initializePaymentPage();

          return;
        }

        this.loadMyPendingSubscription();
      });
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    this.tryInitializeWidget();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.redirectTimeoutId) {
      clearTimeout(this.redirectTimeoutId);
    }

    if (this.widgetRetryTimeoutId) {
      clearTimeout(this.widgetRetryTimeoutId);
    }

    if (this.paymentResponseTimeoutId) {
  clearTimeout(this.paymentResponseTimeoutId);
}
  }

  // ==========================================
  // RECUPERAR SUSCRIPCIÓN PENDIENTE
  // ==========================================

  private loadMyPendingSubscription(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscriptionsService
      .getMyPendingSubscription()
      .pipe(
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          this.subscription = response.data;
          this.subscriptionId = response.data.id;

          this.registrationState.setSubscriptionId(
            response.data.id,
          );

          if (response.data.status === 'ACTIVE') {
            this.isLoading = false;
            this.handlePaymentApproved();

            return;
          }

          if (response.data.status !== 'PENDING') {
            this.isLoading = false;

            this.errorMessage =
              'La suscripción no está pendiente de pago.';

            return;
          }

          this.initializePaymentPage();
        },

        error: (error: unknown) => {
          console.error(
            'Error recuperando la suscripción pendiente:',
            error,
          );

          this.isLoading = false;

          const status =
            this.getHttpStatus(error);

          if (status === 403) {
            this.errorMessage =
              'No tienes autorización para gestionar el pago de esta organización.';

            return;
          }

          if (status === 404) {
            this.errorMessage =
              'No encontramos una suscripción pendiente de pago para tu organización.';

            return;
          }

          this.errorMessage =
            'No fue posible recuperar tu suscripción. Inténtalo nuevamente.';
        },
      });
  }

  private getHttpStatus(error: unknown): number | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error
    ) {
      const status = (error as { status?: unknown }).status;

      return typeof status === 'number'
        ? status
        : null;
    }

    return null;
  }

  // ==========================================
  // INITIALIZE PAYMENT PAGE
  // ==========================================

  private initializePaymentPage(): void {
    if (!this.subscriptionId) {
      this.isLoading = false;

      this.errorMessage =
        'No se encontró la suscripción asociada al pago.';

      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.initializeSession();
    this.loadSubscription();
    this.loadAcceptanceTokens();
    this.loadPaymentAuthorization();
  }

  // ==========================================
  // PAYMENT AUTHORIZATION
  // ==========================================

  private loadPaymentAuthorization(): void {
    if (!this.subscriptionId) {
      this.errorMessage =
        'No se encontró la suscripción asociada al pago.';

      return;
    }

    this.paymentsService
      .authorizePayment(this.subscriptionId)
      .pipe(
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          this.paymentAuthorizationToken =
            response.data.authorizationToken;

          this.tryInitializeWidget();
        },

        error: (error: unknown) => {
          console.error(
            'Error obteniendo autorización de pago:',
            error,
          );

          this.paymentAuthorizationToken = null;

          const status = this.getHttpStatus(error);

          if (status === 403) {
            this.errorMessage =
              'No tienes autorización para realizar este pago. Verifica que hayas iniciado sesión con la cuenta propietaria de la organización.';

            return;
          }

          this.errorMessage =
            'No fue posible autorizar el pago. Inténtalo nuevamente.';
        },
      });
  }

  // ==========================================
  // LOAD SUBSCRIPTION
  // ==========================================

  private loadSubscription(): void {
    if (!this.subscriptionId) {
      this.isLoading = false;

      return;
    }

    this.subscriptionsService
      .getSubscription(this.subscriptionId)
      .pipe(
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          this.subscription = response.data;

          this.isLoading = false;

          const status = response.data.status;

          if (status === 'ACTIVE') {
            this.handlePaymentApproved();

            return;
          }

          if (
            status === 'PENDING' &&
            this.isPaymentReturn
          ) {
            this.startPaymentPolling();

            return;
          }

          if (
            status === 'CANCELED' ||
            status === 'EXPIRED'
          ) {
            this.paymentStatus = 'DECLINED';
            this.isProcessing = false;
            this.isWaitingForPayment = false;

            this.errorMessage =
              'La suscripción no está disponible para realizar el pago.';
          }
        },

        error: (error: unknown) => {
          console.error(
            'Error cargando suscripción:',
            error,
          );

          this.isLoading = false;
          this.isProcessing = false;
          this.isWaitingForPayment = false;
          this.paymentStatus = 'ERROR';

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
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (sessionId: string) => {
          this.sessionId = sessionId;

          this.tryInitializeWidget();
        },

        error: (error: unknown) => {
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
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe({
        /*
         * El backend devuelve los tokens directamente,
         * no dentro de response.data.
         */
        next: (data: WompiAcceptanceTokens) => {
          if (
            !data?.acceptanceToken ||
            !data?.personalDataAuthToken
          ) {
            this.errorMessage =
              'No fue posible obtener los tokens de aceptación de Wompi.';

            console.error(
              'Respuesta de aceptación inválida:',
              data,
            );

            return;
          }

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

        error: (error: unknown) => {
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
    if (this.isPaymentReturn) {
      return;
    }

    if (
      this.widgetInitialized ||
      this.widgetInitializing ||
      !this.viewInitialized ||
      !this.subscriptionId ||
      !this.sessionId ||
      !this.acceptanceToken ||
      !this.personalDataAuthToken ||
      !this.paymentAuthorizationToken
    ) {
      return;
    }

    if (!this.wompiForm) {
      if (!this.widgetRetryTimeoutId) {
        this.widgetRetryTimeoutId = setTimeout(() => {
          this.widgetRetryTimeoutId = undefined;
          this.tryInitializeWidget();
        }, 100);
      }

      return;
    }

    void this.initializeTokenizationWidget();
  }

  private async initializeTokenizationWidget(): Promise<void> {
    if (
      this.widgetInitialized ||
      this.widgetInitializing ||
      !this.wompiForm ||
      this.isPaymentReturn
    ) {
      return;
    }

    this.widgetInitializing = true;

    try {
      await this.wompiTokenizationService.loadWidget();

      if (this.destroy$.closed || !this.wompiForm) {
        return;
      }

      const form = this.wompiForm.nativeElement;

      if (
        !this.subscriptionId ||
        !this.sessionId ||
        !this.paymentAuthorizationToken ||
        !this.acceptanceToken ||
        !this.personalDataAuthToken
      ) {
        this.errorMessage =
          'Faltan datos necesarios para preparar el pago.';

        return;
      }

      /*
       * Datos de la suscripción y autorización.
       */
      this.addHiddenInput(
        form,
        'subscriptionId',
        this.subscriptionId,
      );

      this.addHiddenInput(
        form,
        'sessionId',
        this.sessionId,
      );

      this.addHiddenInput(
        form,
        'paymentAuthorizationToken',
        this.paymentAuthorizationToken,
      );

      

      /*
       * Evita duplicar el script del widget.
       */
      const existingScript = form.querySelector(
        'script[data-widget-operation="tokenize"]',
      );

      if (existingScript) {
        this.widgetInitialized = true;

        return;
      }

      const script = document.createElement('script');

      script.src =
        'https://checkout.wompi.co/widget.js';

      script.async = true;

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
        this.wompiTokenizationService.getPublicKey(),
      );

      form.appendChild(script);

      this.widgetInitialized = true;
    } catch (error: unknown) {
      console.error(
        'Error inicializando Widget Wompi:',
        error,
      );

      this.errorMessage =
        'No fue posible cargar el formulario seguro de Wompi.';
    } finally {
      this.widgetInitializing = false;
    }
  }

  private addHiddenInput(
    form: HTMLFormElement,
    name: string,
    value: string,
  ): void {
    let input = form.querySelector<HTMLInputElement>(
      `input[name="${name}"]`,
    );

    if (!input) {
      input = document.createElement('input');

      input.type = 'hidden';
      input.name = name;

      form.appendChild(input);
    }

    input.value = value;
  }

  // ==========================================
  // PAYMENT
  // ==========================================

  canStartPayment(): boolean {
    return !!this.subscriptionId &&
      !!this.sessionId &&
      !!this.acceptanceToken &&
      !!this.personalDataAuthToken &&
      !!this.paymentAuthorizationToken &&
      this.wompiTermsAccepted &&
      this.personalDataAccepted &&
      !this.isProcessing &&
      !this.isWaitingForPayment;
  }

  continueToPayment(): void {
    this.errorMessage = '';

    if (!this.wompiTermsAccepted) {
      this.errorMessage =
        'Debes aceptar los términos y condiciones de Wompi.';

      return;
    }

    if (!this.personalDataAccepted) {
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

    if (!this.personalDataAuthToken) {
      this.errorMessage =
        'No se obtuvo la autorización de datos personales de Wompi.';

      return;
    }

    if (!this.paymentAuthorizationToken) {
      this.errorMessage =
        'No se ha autorizado el pago. Espera unos segundos e inténtalo nuevamente.';

      return;
    }

    this.isProcessing = true;
  }

  // ==========================================
  // WOMPI SUBMIT
  // ==========================================
onWompiSubmit(event: Event): void {
  if (!this.canStartPayment()) {
    event.preventDefault();

    this.errorMessage =
      'Completa las autorizaciones requeridas antes de continuar con el pago.';

    return;
  }

  this.errorMessage = '';
  this.isProcessing = true;
  this.isWaitingForPayment = true;
  this.paymentStatus = 'PENDING';
}

onPaymentResponseLoad(): void {
  /*
   * Los navegadores también disparan load al cargar
   * inicialmente el iframe vacío. No se debe interpretar
   * ese evento como una respuesta del backend.
   */
  if (!this.isProcessing || !this.subscriptionId) {
    return;
  }

  this.paymentResponseReceived = true;

  if (this.paymentResponseTimeoutId) {
    clearTimeout(this.paymentResponseTimeoutId);
    this.paymentResponseTimeoutId = undefined;
  }

  /*
   * No necesitamos leer el contenido del iframe.
   * Al ser de otro origen, el navegador impide que Angular
   * inspeccione directamente su respuesta.
   *
   * Consultamos el estado real de la suscripción en el API.
   */
  this.startPaymentPolling();
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

    this.pollingStarted = true;
    this.isPaymentReturn = true;
    this.isWaitingForPayment = true;
    this.isProcessing = true;
    this.paymentStatus = 'PENDING';

    this.subscriptionsService
      .getSubscription(this.subscriptionId)
      .pipe(
        catchError((error: unknown) => {
          console.error(
            'Error en consulta inicial del pago:',
            error,
          );

          this.handlePollingError();

          return EMPTY;
        }),

        switchMap((response) => {
          this.updateSubscriptionFromPolling(
            response.data,
          );

          if (response.data.status === 'ACTIVE') {
            this.handlePaymentApproved();

            return EMPTY;
          }

          return interval(2000).pipe(
            switchMap(() => {
              if (!this.subscriptionId) {
                return throwError(
                  () => new Error(
                    'No se encontró la suscripción.',
                  ),
                );
              }

              return this.subscriptionsService.getSubscription(
                this.subscriptionId,
              );
            }),

            take(30),

            takeWhile(
              (pollResponse) =>
                pollResponse.data.status === 'PENDING',
              true,
            ),
          );
        }),

        takeUntil(this.destroy$),

        catchError((error: unknown) => {
          console.error(
            'Error consultando estado de suscripción:',
            error,
          );

          this.handlePollingError();

          return EMPTY;
        }),
      )
      .subscribe({
        next: (response) => {
          this.updateSubscriptionFromPolling(
            response.data,
          );

          const status = response.data.status;

          if (status === 'ACTIVE') {
            this.handlePaymentApproved();

            return;
          }

          if (
            status === 'CANCELED' ||
            status === 'EXPIRED'
          ) {
            this.paymentStatus = 'DECLINED';
            this.isWaitingForPayment = false;
            this.isProcessing = false;

            this.errorMessage =
              'El pago no pudo ser confirmado. Puedes intentar nuevamente.';
          }
        },

        complete: () => {
          if (this.paymentStatus === 'APPROVED') {
            return;
          }

          if (this.subscription?.status === 'PENDING') {
            this.isWaitingForPayment = false;
            this.isProcessing = false;
            this.paymentStatus = 'PENDING';

            this.errorMessage =
              'El pago todavía está siendo procesado. Puedes consultar nuevamente en unos momentos.';
          }
        },
      });
  }

  private updateSubscriptionFromPolling(
    subscription: Subscription,
  ): void {
    this.subscription = subscription;
  }

  private handlePollingError(): void {
    this.paymentStatus = 'ERROR';
    this.isWaitingForPayment = false;
    this.isProcessing = false;

    this.errorMessage =
      'No fue posible consultar el estado del pago.';
  }

  // ==========================================
  // PAYMENT APPROVED
  // ==========================================

  private handlePaymentApproved(): void {
    if (this.paymentStatus === 'APPROVED') {
      return;
    }

    this.paymentStatus = 'APPROVED';
    this.isWaitingForPayment = false;
    this.isProcessing = false;

    this.registrationState.clear();

    this.redirectTimeoutId = setTimeout(() => {
      void this.router.navigate([
        '/app/dashboard',
      ]);
    }, 1000);
  }

  // ==========================================
  // FORMATTERS
  // ==========================================

  get formattedPrice(): string {
    if (!this.subscription?.plan?.priceAmount) {
      return '$0';
    }

    const amount = Number(
      this.subscription.plan.priceAmount,
    );

    return new Intl.NumberFormat(
      'es-CO',
      {
        style: 'currency',
        currency:
          this.subscription.plan.currency || 'COP',
        maximumFractionDigits: 0,
      },
    ).format(amount);
  }

  get planName(): string {
    return this.subscription?.plan?.name || 'Plan';
  }

  get billingInterval(): string {
    return this.subscription?.plan?.billingInterval === 'YEAR'
      ? 'año'
      : 'mes';
  }

  get isPaymentReady(): boolean {
    return !!this.sessionId &&
      !!this.acceptanceToken &&
      !!this.personalDataAuthToken &&
      !!this.paymentAuthorizationToken;
  }

  get paymentMessage(): string {
    switch (this.paymentStatus) {
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