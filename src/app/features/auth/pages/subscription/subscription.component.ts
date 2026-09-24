import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  NavigationStart,
  Router,
  RouterLink
} from '@angular/router';

type PlanType = 'pro' | 'business';

interface SubscriptionPlan {
  id: PlanType;
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface ExpiryOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss'
})
export class SubscriptionComponent implements OnInit {

  subscriptionForm!: FormGroup;

  selectedPlan: PlanType = 'pro';

  plan!: SubscriptionPlan;

  isSubmitting = false;

  // ==========================================
  // DATOS PARA LA TARJETA VISUAL
  // ==========================================

  cardNumber = '';

  cardholderName = '';

  expiryDate = '';

  cvv = '';

  // ==========================================
  // VENCIMIENTO
  // ==========================================

  selectedExpiryYear = '';

  expiryMonths: ExpiryOption[] = [
    {
      value: '01',
      label: '01'
    },
    {
      value: '02',
      label: '02'
    },
    {
      value: '03',
      label: '03'
    },
    {
      value: '04',
      label: '04'
    },
    {
      value: '05',
      label: '05'
    },
    {
      value: '06',
      label: '06'
    },
    {
      value: '07',
      label: '07'
    },
    {
      value: '08',
      label: '08'
    },
    {
      value: '09',
      label: '09'
    },
    {
      value: '10',
      label: '10'
    },
    {
      value: '11',
      label: '11'
    },
    {
      value: '12',
      label: '12'
    }
  ];

  expiryYears: ExpiryOption[] = [];

  // ==========================================
  // PLANES
  // ==========================================

  plans: SubscriptionPlan[] = [
    {
      id: 'pro',
      name: 'Pro',
      price: 39,
      description: 'Para restaurantes que quieren crecer.',
      features: [
        'Promociones ilimitadas',
        'Códigos QR personalizados',
        'Analíticas avanzadas',
        'Segmentación de clientes',
        'Usuarios y roles'
      ]
    },
    {
      id: 'business',
      name: 'Business',
      price: 89,
      description: 'Para equipos y operaciones más grandes.',
      features: [
        'Todo lo incluido en Pro',
        'Múltiples restaurantes',
        'Reportes avanzados',
        'Gestión de equipos',
        'Soporte prioritario'
      ]
    }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  // ==========================================
  // INIT
  // ==========================================

  ngOnInit(): void {

    this.createForm();

    this.generateExpiryYears();

    this.handlePlan();

    this.setupFormListeners();

    this.setupNavigationProtection();
  }

  private setupNavigationProtection(): void {

  this.router.events.subscribe(event => {

    if (!(event instanceof NavigationStart)) {
      return;
    }

    const currentUrl = this.router.url;

    const isLeavingSubscription =
      currentUrl.startsWith('/auth/subscription');

    const isGoingToSubscription =
      event.url.startsWith('/auth/subscription');

    if (
      isLeavingSubscription &&
      !isGoingToSubscription
    ) {

      sessionStorage.removeItem(
        'pending_registration'
      );
    }
  });
}

  // ==========================================
  // FORMULARIO
  // ==========================================

  private createForm(): void {

    this.subscriptionForm = this.fb.group({

      cardNumber: [
        '',
        [
          Validators.required,
          Validators.minLength(16)
        ]
      ],

      cardholderName: [
        '',
        [
          Validators.required,
          Validators.minLength(3)
        ]
      ],

      expiryMonth: [
        '',
        Validators.required
      ],

      expiryYear: [
        '',
        Validators.required
      ],

      cvv: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(4)
        ]
      ]

    });
  }

  // ==========================================
  // PLAN
  // ==========================================

  private handlePlan(): void {

    this.route.queryParamMap.subscribe(params => {

      const plan = params.get('plan');

      // ==========================================
      // 1. VALIDAR PLAN
      // ==========================================

      if (plan !== 'pro' && plan !== 'business') {

        this.router.navigate(['/auth/register']);

        return;
      }

      // ==========================================
      // 2. VALIDAR REGISTRO PENDIENTE
      // ==========================================

      const pendingRegistration =
        sessionStorage.getItem('pending_registration');

      if (!pendingRegistration) {

        this.router.navigate(
          ['/auth/register'],
          {
            queryParams: {
              plan: plan
            }
          }
        );

        return;
      }

      // ==========================================
      // 3. VALIDAR INFORMACIÓN DEL REGISTRO
      // ==========================================

      try {

        const registration =
          JSON.parse(pendingRegistration);

        // Verificamos que el registro
        // corresponda al mismo plan.

        if (registration.plan !== plan) {

          sessionStorage.removeItem(
            'pending_registration'
          );

          this.router.navigate(
            ['/auth/register'],
            {
              queryParams: {
                plan: plan
              }
            }
          );

          return;
        }

        // ==========================================
        // 4. TODO CORRECTO
        // ==========================================

        this.selectedPlan = plan;

        this.loadPlan();

      } catch {

        // Si el contenido está corrupto,
        // eliminamos el registro pendiente.

        sessionStorage.removeItem(
          'pending_registration'
        );

        this.router.navigate(
          ['/auth/register'],
          {
            queryParams: {
              plan: plan
            }
          }
        );
      }
    });
  }

  private loadPlan(): void {

    const selectedPlan = this.plans.find(
      plan => plan.id === this.selectedPlan
    );

    if (!selectedPlan) {

      this.router.navigate(['/auth/register']);

      return;
    }

    this.plan = selectedPlan;
  }

  // ==========================================
  // LISTENERS DEL FORMULARIO
  // ==========================================

  private setupFormListeners(): void {

    // Número de tarjeta

    this.subscriptionForm
      .get('cardNumber')
      ?.valueChanges
      .subscribe(value => {

        this.cardNumber = this.formatCardNumber(value);

        if (this.cardNumber !== value) {

          this.subscriptionForm
            .get('cardNumber')
            ?.setValue(
              this.cardNumber,
              {
                emitEvent: false
              }
            );
        }
      });


    // Nombre del titular

    this.subscriptionForm
      .get('cardholderName')
      ?.valueChanges
      .subscribe(value => {

        this.cardholderName = value || '';

      });


    // Mes

    this.subscriptionForm
      .get('expiryMonth')
      ?.valueChanges
      .subscribe(() => {

        this.updateExpiryDate();

      });


    // Año

    this.subscriptionForm
      .get('expiryYear')
      ?.valueChanges
      .subscribe(value => {

        this.selectedExpiryYear = value || '';

        this.validateSelectedMonth();

        this.updateExpiryDate();

      });


    // CVV

    this.subscriptionForm
      .get('cvv')
      ?.valueChanges
      .subscribe(value => {

        this.cvv = value || '';

      });
  }

  // ==========================================
  // NÚMERO DE TARJETA
  // ==========================================

  private formatCardNumber(value: string): string {

    const numbers = (value || '')
      .replace(/\D/g, '')
      .substring(0, 16);

    return numbers
      .replace(/(.{4})/g, '$1 ')
      .trim();
  }

  get maskedCardNumber(): string {

    const numbers = this.cardNumber.replace(/\D/g, '');

    if (!numbers) {

      return '•••• •••• •••• ••••';
    }

    const lastFour = numbers.slice(-4);

    return `•••• •••• •••• ${lastFour}`;
  }

  // ==========================================
  // AÑOS DE VENCIMIENTO
  // ==========================================

  private generateExpiryYears(): void {

    const currentYear = new Date().getFullYear();

    const numberOfYears = 10;

    this.expiryYears = Array.from(
      {
        length: numberOfYears
      },
      (_, index) => {

        const year = currentYear + index;

        return {
          value: String(year),
          label: String(year)
        };

      }
    );
  }

  // ==========================================
  // MESES DISPONIBLES
  // ==========================================

  getAvailableMonths(): ExpiryOption[] {

    const currentDate = new Date();

    const currentYear = currentDate.getFullYear();

    const currentMonth = currentDate.getMonth() + 1;

    const selectedYear = Number(
      this.selectedExpiryYear
    );

    // Si todavía no seleccionó año,
    // mostramos todos los meses.

    if (!selectedYear) {

      return this.expiryMonths;
    }

    // Si seleccionó el año actual,
    // solamente mostramos meses actuales
    // o futuros.

    if (selectedYear === currentYear) {

      return this.expiryMonths.filter(
        month =>
          Number(month.value) >= currentMonth
      );
    }

    // Para años futuros todos los meses son válidos.

    return this.expiryMonths;
  }

  // ==========================================
  // VALIDAR MES SELECCIONADO
  // ==========================================

  private validateSelectedMonth(): void {

    const availableMonths =
      this.getAvailableMonths();

    const selectedMonth =
      this.subscriptionForm
        .get('expiryMonth')
        ?.value;

    const isValidMonth =
      availableMonths.some(
        month =>
          month.value === selectedMonth
      );

    if (!isValidMonth) {

      this.subscriptionForm
        .get('expiryMonth')
        ?.setValue('');
    }
  }

  // ==========================================
  // CAMBIO DE AÑO
  // ==========================================

  onExpiryYearChange(): void {

    this.selectedExpiryYear =
      this.subscriptionForm
        .get('expiryYear')
        ?.value || '';

    this.validateSelectedMonth();

    this.updateExpiryDate();
  }

  // ==========================================
  // FECHA PARA LA TARJETA VISUAL
  // ==========================================

  updateExpiryDate(): void {

    const month =
      this.subscriptionForm
        .get('expiryMonth')
        ?.value;

    const year =
      this.subscriptionForm
        .get('expiryYear')
        ?.value;

    if (!month || !year) {

      this.expiryDate = '';

      return;
    }

    const shortYear =
      String(year).slice(-2);

    this.expiryDate =
      `${month}/${shortYear}`;
  }

  // ==========================================
  // SUBMIT
  // ==========================================

  submit(): void {

  if (this.subscriptionForm.invalid) {

    this.subscriptionForm.markAllAsTouched();

    return;
  }

  this.isSubmitting = true;

  const formValue =
    this.subscriptionForm.value;

  const paymentData = {

    plan: this.selectedPlan,

    cardNumber:
      formValue.cardNumber,

    cardholderName:
      formValue.cardholderName,

    expiryMonth:
      formValue.expiryMonth,

    expiryYear:
      formValue.expiryYear,

    cvv:
      formValue.cvv
  };

  console.log(
    'Procesar suscripción:',
    paymentData
  );

  // ==========================================
  // SIMULACIÓN DE PAGO EXITOSO
  // ==========================================

  sessionStorage.removeItem(
    'pending_registration'
  );

  this.isSubmitting = false;

  this.router.navigate([
    '/app/dashboard'
  ]);
}
}