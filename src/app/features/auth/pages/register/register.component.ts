import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import { DecimalPipe } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import { forkJoin } from 'rxjs';

import {
  RegistrationStateService,
  PlanCode
} from '../../../../core/services/auth/registration-state.service';

import {
  AuthService,
  RegisterRequest
} from '../../../../core/services/auth/auth.service';

import {
  AuthStateService
} from '../../../../core/services/auth/auth-state.service';

import {
  Cuisine,
  CuisinesService
} from '../../../../core/services/catalogs/cuisines/cuisines.service';

import {
  PriceRange,
  PriceRangesService
} from '../../../../core/services/catalogs/priceRange/price-range.service';

import * as L from 'leaflet';

interface RegisterStep {
  number: number;
  label: string;
}

interface SelectedLocation {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DecimalPipe
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent
  implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('map')
  mapElement?: ElementRef<HTMLDivElement>;

  registerForm!: FormGroup;

  selectedPlan: PlanCode | null = null;

  isSubmitting = false;

  currentStep = 1;

  totalSteps = 5;

  isSearchingLocation = false;

  isLoadingCatalogs = false;

  catalogsError = false;

  selectedLocation: SelectedLocation | null = null;

  private map?: L.Map;

  private marker?: L.Marker;

  steps: RegisterStep[] = [
    {
      number: 1,
      label: 'Tus datos'
    },
    {
      number: 2,
      label: 'Restaurante'
    },
    {
      number: 3,
      label: 'Ubicación'
    },
    {
      number: 4,
      label: 'Información pública'
    },
    {
      number: 5,
      label: 'Cuenta'
    }
  ];

  cuisines: Cuisine[] = [];

  priceRanges: PriceRange[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly registrationState: RegistrationStateService,
    private readonly authService: AuthService,
    private readonly authState: AuthStateService,
    private readonly cuisinesService: CuisinesService,
    private readonly priceRangesService: PriceRangesService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPlan();
    this.loadCatalogs();
  }

  ngAfterViewInit(): void {
    if (this.currentStep === 3) {
      this.initializeMap();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  /*
   * ============================================================
   * FORM
   * ============================================================
   */

  private initializeForm(): void {
    this.registerForm = this.fb.group({

      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100)
        ]
      ],

      restaurantName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(150)
        ]
      ],

      cuisineCode: [
        '',
        Validators.required
      ],

      description: [
        '',
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(500)
        ]
      ],

      phone: [
        '',
        Validators.maxLength(30)
      ],

      address: [
        '',
        [
          Validators.required,
          Validators.maxLength(255)
        ]
      ],

      city: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      department: [
        '',
        Validators.maxLength(100)
      ],

      latitude: [
        null
      ],

      longitude: [
        null
      ],

      priceRangeCode: [
        '',
        Validators.required
      ],

      website: [
        '',
        Validators.maxLength(255)
      ],

      instagram: [
        '',
        Validators.maxLength(100)
      ],

      facebook: [
        '',
        Validators.maxLength(255)
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(191)
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128)
        ]
      ],

      terms: [
        false,
        Validators.requiredTrue
      ]
    });
  }

  /*
   * ============================================================
   * PLAN
   * ============================================================
   */

  private loadPlan(): void {
    const plan =
      this.registrationState.getSelectedPlan();

    if (!plan) {
      this.router.navigate(['/']);
      return;
    }

    this.selectedPlan = plan;
  }

  get planName(): string {
    switch (this.selectedPlan) {

      case 'starter':
        return 'Starter';

      case 'pro':
        return 'Pro';

      case 'business':
        return 'Business';

      default:
        return '';
    }
  }

  get planDescription(): string {
    switch (this.selectedPlan) {

      case 'starter':
        return 'Comienza gratis y crea tus primeras promociones para tu restaurante.';

      case 'pro':
        return 'Para restaurantes que quieren crecer con herramientas avanzadas.';

      case 'business':
        return 'Para equipos y operaciones más grandes.';

      default:
        return '';
    }
  }

  requiresPayment(): boolean {
    return this.selectedPlan !== 'starter';
  }

  /*
   * ============================================================
   * PLAN VALIDATION
   * ============================================================
   */

  private isValidPlanCode(
    value: string
  ): value is PlanCode {
    return (
      value === 'starter' ||
      value === 'pro' ||
      value === 'business'
    );
  }

  /*
   * ============================================================
   * CATALOGS
   * ============================================================
   */

  private loadCatalogs(): void {
    this.isLoadingCatalogs = true;
    this.catalogsError = false;

    forkJoin({
      cuisines:
        this.cuisinesService.getCuisines(),

      priceRanges:
        this.priceRangesService.getPriceRanges()
    }).subscribe({
      next: (response) => {

        this.cuisines =
          response.cuisines.data;

        this.priceRanges =
          response.priceRanges.data;

        this.isLoadingCatalogs = false;
      },

      error: (error) => {

        console.error(
          'Error cargando catálogos:',
          error
        );

        this.catalogsError = true;
        this.isLoadingCatalogs = false;
      }
    });
  }

  /*
   * ============================================================
   * STEP INFORMATION
   * ============================================================
   */

  get currentStepTitle(): string {
    switch (this.currentStep) {

      case 1:
        return 'Crea tu restaurante en PromoTable';

      case 2:
        return 'Cuéntanos sobre tu restaurante';

      case 3:
        return '¿Dónde está tu restaurante?';

      case 4:
        return 'Haz que te encuentren';

      case 5:
        return 'Casi terminamos';

      default:
        return 'Crea tu cuenta';
    }
  }

  get currentStepDescription(): string {
    switch (this.currentStep) {

      case 1:
        return 'Comencemos con tus datos personales.';

      case 2:
        return 'Cuéntanos un poco sobre el restaurante que administrarás.';

      case 3:
        return 'Ayuda a tus clientes a encontrar fácilmente tu restaurante.';

      case 4:
        return 'Agrega la información pública de tu restaurante.';

      case 5:
        return 'Crea tus credenciales para administrar tu restaurante.';

      default:
        return '';
    }
  }

  get progressPercentage(): number {
    if (this.totalSteps <= 1) {
      return 100;
    }

    return Math.round(
      ((this.currentStep - 1) /
        (this.totalSteps - 1)) *
      100
    );
  }

  /*
   * ============================================================
   * NAVIGATION
   * ============================================================
   */

  nextStep(): void {
    if (this.currentStep >= this.totalSteps) {
      return;
    }

    if (!this.isCurrentStepValid()) {
      this.markCurrentStepAsTouched();
      return;
    }

    this.currentStep++;

    if (this.currentStep === 3) {
      setTimeout(() => {
        this.initializeMap();
      });
    }

    if (this.currentStep === 3) {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 100);
    }
  }

  previousStep(): void {
    if (this.currentStep <= 1) {
      return;
    }

    this.currentStep--;

    if (this.currentStep === 3) {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 100);
    }
  }

  goToStep(step: number): void {
    if (
      step < 1 ||
      step > this.totalSteps
    ) {
      return;
    }

    if (step === this.currentStep) {
      return;
    }

    if (step < this.currentStep) {
      this.currentStep = step;

      if (this.currentStep === 3) {
        setTimeout(() => {
          this.initializeMap();
          this.map?.invalidateSize();
        });
      }

      return;
    }

    if (!this.isCurrentStepValid()) {
      this.markCurrentStepAsTouched();
      return;
    }

    this.currentStep = step;

    if (this.currentStep === 3) {
      setTimeout(() => {
        this.initializeMap();
        this.map?.invalidateSize();
      });
    }
  }

  /*
   * ============================================================
   * VALIDATION
   * ============================================================
   */

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {

      case 1:
        return this.isStepValid([
          'name'
        ]);

      case 2:
        return this.isStepValid([
          'restaurantName',
          'cuisineCode',
          'description'
        ]);

      case 3:
        return this.isStepValid([
          'address',
          'city'
        ]);

      case 4:
        return this.isStepValid([
          'priceRangeCode'
        ]);

      case 5:
        return this.isStepValid([
          'email',
          'password',
          'terms'
        ]);

      default:
        return false;
    }
  }

  private isStepValid(
    fields: string[]
  ): boolean {

    return fields.every(field => {

      const control =
        this.registerForm.get(field);

      return control
        ? control.valid
        : false;
    });
  }

  private markCurrentStepAsTouched(): void {

    const fieldsByStep:
      Record<number, string[]> = {

      1: [
        'name'
      ],

      2: [
        'restaurantName',
        'cuisineCode',
        'description'
      ],

      3: [
        'address',
        'city'
      ],

      4: [
        'priceRangeCode'
      ],

      5: [
        'email',
        'password',
        'terms'
      ]
    };

    const fields =
      fieldsByStep[this.currentStep] ?? [];

    fields.forEach(field => {

      this.registerForm
        .get(field)
        ?.markAsTouched();

    });
  }

  /*
   * ============================================================
   * MAP
   * ============================================================
   */

  private initializeMap(): void {

    if (!this.mapElement?.nativeElement) {
      return;
    }

    if (this.map) {
      this.map.invalidateSize();
      return;
    }

    const initialLatitude = 10.9878;
    const initialLongitude = -74.7889;

    this.map = L.map(
      this.mapElement.nativeElement,
      {
        center: [
          initialLatitude,
          initialLongitude
        ],
        zoom: 13
      }
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.map);

    this.map.on(
      'click',
      (event: L.LeafletMouseEvent) => {

        this.setMapLocation(
          event.latlng.lat,
          event.latlng.lng
        );
      }
    );
  }

  private setMapLocation(
    latitude: number,
    longitude: number
  ): void {

    this.selectedLocation = {
      lat: latitude,
      lng: longitude
    };

    this.registerForm.patchValue({
      latitude,
      longitude
    });

    const position = L.latLng(
      latitude,
      longitude
    );

    if (this.marker) {

      this.marker.setLatLng(
        position
      );

    } else if (this.map) {

      this.marker =
        L.marker(
          position,
          {
            draggable: true
          }
        ).addTo(this.map);

      this.marker.on(
        'dragend',
        () => {

          if (!this.marker) {
            return;
          }

          const location =
            this.marker.getLatLng();

          this.setMapLocation(
            location.lat,
            location.lng
          );
        }
      );
    }

    this.map?.setView(
      position,
      16
    );
  }

  /*
   * ============================================================
   * LOCATION SEARCH
   * ============================================================
   */

  searchLocation(): void {

    const addressControl =
      this.registerForm.get('address');

    const cityControl =
      this.registerForm.get('city');

    const departmentControl =
      this.registerForm.get('department');

    const address =
      addressControl?.value?.trim();

    const city =
      cityControl?.value?.trim();

    const department =
      departmentControl?.value?.trim();

    if (!address) {
      addressControl?.markAsTouched();
      return;
    }

    this.isSearchingLocation = true;

    const query = [
      address,
      city,
      department,
      'Colombia'
    ]
      .filter(Boolean)
      .join(', ');

    const url =
      'https://nominatim.openstreetmap.org/search';

    const params =
      new URLSearchParams({
        q: query,
        format: 'json',
        limit: '1',
        countrycodes: 'co'
      });

    fetch(
      `${url}?${params.toString()}`,
      {
        headers: {
          Accept:
            'application/json'
        }
      }
    )
      .then(response => {

        if (!response.ok) {
          throw new Error(
            'No fue posible consultar la ubicación.'
          );
        }

        return response.json();
      })
      .then(
        (
          results: Array<{
            lat: string;
            lon: string;
            display_name: string;
          }>
        ) => {

          if (!results.length) {
            throw new Error(
              'No se encontró la ubicación.'
            );
          }

          const latitude =
            Number(results[0].lat);

          const longitude =
            Number(results[0].lon);

          if (
            Number.isNaN(latitude) ||
            Number.isNaN(longitude)
          ) {
            throw new Error(
              'La ubicación recibida no es válida.'
            );
          }

          this.setMapLocation(
            latitude,
            longitude
          );

          this.registerForm.patchValue({
            address
          });
        }
      )
      .catch(error => {

        console.error(
          'Error buscando ubicación:',
          error
        );

      })
      .finally(() => {

        this.isSearchingLocation =
          false;

      });
  }

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  submit(): void {

    if (this.isSubmitting) {
      return;
    }

    if (!this.selectedPlan) {
      this.router.navigate(['/']);
      return;
    }

    if (
      this.isLoadingCatalogs ||
      this.catalogsError
    ) {
      return;
    }

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const formValue =
      this.registerForm.getRawValue();

    const request: RegisterRequest = {

      name:
        formValue.name,

      email:
        formValue.email,

      password:
        formValue.password,

      terms:
        formValue.terms,

      restaurantName:
        formValue.restaurantName,

      cuisineCode:
        formValue.cuisineCode,

      description:
        formValue.description,

      phone:
        formValue.phone ||
        undefined,

      address:
        formValue.address,

      city:
        formValue.city,

      department:
        formValue.department ||
        undefined,

      latitude:
        formValue.latitude ??
        undefined,

      longitude:
        formValue.longitude ??
        undefined,

      priceRangeCode:
        formValue.priceRangeCode,

      website:
        formValue.website ||
        undefined,

      instagram:
        formValue.instagram ||
        undefined,

      facebook:
        formValue.facebook ||
        undefined,

      planCode:
        this.selectedPlan
    };

    this.authService
      .register(request)
      .subscribe({

        next: (response) => {

          /*
           * El backend devuelve el plan como string.
           *
           * Validamos el valor antes de utilizarlo
           * como PlanCode.
           */
          const planCode =
            response.data.plan.code;

          if (
            !this.isValidPlanCode(
              planCode
            )
          ) {

            console.error(
              'Plan recibido no válido:',
              planCode
            );

            this.isSubmitting = false;

            return;
          }

          this.registrationState
            .setSelectedPlan(
              planCode
            );

          this.registrationState
            .setSubscriptionId(
              response.data.subscription.id
            );

          /*
           * El backend ya creó las cookies
           * HttpOnly.
           *
           * Recuperamos la sesión mediante
           * GET /auth/me.
           */
          this.authState.reset();

          this.authState
            .initialize()
            .subscribe({

              next: (
                authenticated
              ) => {

                if (!authenticated) {

                  this.isSubmitting =
                    false;

                  return;
                }

                /*
                 * STARTER
                 */
                if (
                  planCode ===
                  'starter'
                ) {

                  this.registrationState
                    .clear();

                  this.router.navigate([
                    '/app/dashboard'
                  ]);

                  return;
                }

                /*
                 * PRO / BUSINESS
                 */
                this.router.navigate([
                  '/auth/subscription'
                ]);
              },

              error: () => {

                this.isSubmitting =
                  false;
              }
            });
        },

        error: (error) => {

          console.error(
            'Error registrando restaurante:',
            error
          );

          this.isSubmitting =
            false;
        }
      });
  }
}