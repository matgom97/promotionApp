import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';

import { DecimalPipe } from '@angular/common';

import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  Router,
  RouterLink,
} from '@angular/router';

import {
  forkJoin,
  Subscription,
} from 'rxjs';

import {
  RegistrationStateService,
  PlanCode,
} from '../../../../core/services/auth/registration-state.service';

import {
  AuthService,
  RegisterRequest,
} from '../../../../core/services/auth/auth.service';

import {
  AuthStateService,
} from '../../../../core/services/auth/auth-state.service';

import {
  Cuisine,
  CuisinesService,
} from '../../../../core/services/catalogs/cuisines/cuisines.service';

import {
  PriceRange,
  PriceRangesService,
} from '../../../../core/services/catalogs/priceRange/price-range.service';

import {
  Plan,
  PlanType,
} from '../../../../core/models/plan.model';

// Ajusta esta ruta al servicio real de tu proyecto.
import {
  PlansService,
} from '../../../../core/services/plans/plans.service';

import * as L from 'leaflet';

interface RegisterStep {
  number: number;
  label: string;
}

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface BranchMap {
  map: L.Map;
  marker: L.Marker;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent
  implements OnInit, AfterViewInit, OnDestroy {

  @ViewChildren('branchMap', { read: ElementRef })
  branchMapElements!: QueryList<ElementRef<HTMLDivElement>>;

  registerForm!: FormGroup;

  selectedPlan: PlanCode | null = null;

  selectedPlanDetails: Plan | null = null;

  plans: Plan[] = [];

  /**
   * Límite obtenido del endpoint.
   * No se establece una cantidad fija en el frontend.
   */
  maxRestaurants: number | null = null;

  isSubmitting = false;

  isLoadingCatalogs = false;

  catalogsError = false;

  isLoadingPlanLimits = true;

  planLimitError = false;

  currentStep = 1;

  totalSteps = 5;

  isSearchingBranch: number | null = null;

  cuisines: Cuisine[] = [];

  priceRanges: PriceRange[] = [];

  steps: RegisterStep[] = [
    { number: 1, label: 'Tus datos' },
    { number: 2, label: 'Restaurante' },
    { number: 3, label: 'Sedes' },
    { number: 4, label: 'Información pública' },
    { number: 5, label: 'Cuenta' },
  ];

  private readonly defaultLatitude = 10.9878;

  private readonly defaultLongitude = -74.7889;

  private readonly branchMaps = new Map<number, BranchMap>();

  private branchMapChangesSubscription?: Subscription;

  private branchMapInitializationTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly registrationState: RegistrationStateService,
    private readonly authService: AuthService,
    private readonly authState: AuthStateService,
    private readonly cuisinesService: CuisinesService,
    private readonly priceRangesService: PriceRangesService,
    private readonly plansService: PlansService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPlan();
    this.loadCatalogs();
  }

  ngAfterViewInit(): void {
    this.branchMapChangesSubscription =
      this.branchMapElements.changes.subscribe(() => {
        if (this.currentStep === 3) {
          this.scheduleBranchMapsInitialization();
        }
      });

    if (this.currentStep === 3) {
      this.scheduleBranchMapsInitialization();
    }
  }

  ngOnDestroy(): void {
    this.branchMapChangesSubscription?.unsubscribe();

    if (this.branchMapInitializationTimer) {
      clearTimeout(this.branchMapInitializationTimer);
    }

    this.destroyBranchMaps();
  }

  // ============================================================
  // FORMULARIO
  // ============================================================

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],

      restaurantName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(150),
        ],
      ],

      cuisineCode: ['', Validators.required],

      description: [
        '',
        Validators.maxLength(500),
      ],

      phone: [
        '',
        Validators.maxLength(30),
      ],

      priceRangeCode: ['', Validators.required],

      website: [
        '',
        Validators.maxLength(255),
      ],

      instagram: [
        '',
        Validators.maxLength(100),
      ],

      facebook: [
        '',
        Validators.maxLength(255),
      ],

      restaurants: this.fb.array([
        this.createRestaurantForm(),
      ]),

      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(191),
        ],
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(12),
          Validators.maxLength(128),
        ],
      ],

      terms: [
        false,
        Validators.requiredTrue,
      ],
    });
  }

  get restaurants(): FormArray {
    return this.registerForm.get('restaurants') as FormArray;
  }

  /**
   * Indica si se puede agregar otra sede.
   *
   * Si el endpoint falla o el límite todavía no está cargado,
   * no permite agregar sedes hasta conocer el límite.
   */
  get canAddRestaurant(): boolean {
    if (
      this.isLoadingPlanLimits ||
      this.planLimitError ||
      !this.selectedPlanDetails ||
      this.maxRestaurants === null
    ) {
      return false;
    }

    return this.restaurants.length < this.maxRestaurants;
  }

  get remainingRestaurants(): number {
    if (this.maxRestaurants === null) {
      return 0;
    }

    return Math.max(
      0,
      this.maxRestaurants - this.restaurants.length,
    );
  }

  get planName(): string {
    return this.selectedPlanDetails?.name ?? '';
  }

  get planDescription(): string {
    return this.selectedPlanDetails?.description ?? '';
  }

  private createRestaurantForm(
    initialValues?: Partial<{
      name: string;
      description: string;
      phone: string;
      address: string;
      city: string;
      department: string;
      latitude: number | null;
      longitude: number | null;
    }>,
  ): FormGroup {
    return this.fb.group({
      name: [
        initialValues?.name ?? '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(150),
        ],
      ],

      description: [
        initialValues?.description ?? '',
        Validators.maxLength(500),
      ],

      phone: [
        initialValues?.phone ?? '',
        Validators.maxLength(30),
      ],

      address: [
        initialValues?.address ?? '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(255),
        ],
      ],

      city: [
        initialValues?.city ?? '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],

      department: [
        initialValues?.department ?? '',
        Validators.maxLength(100),
      ],

      latitude: [
        initialValues?.latitude ?? null,
      ],

      longitude: [
        initialValues?.longitude ?? null,
      ],
    });
  }

  addRestaurant(): void {
    if (!this.canAddRestaurant) {
      return;
    }

    this.restaurants.push(this.createRestaurantForm());

    this.restaurants.markAsDirty();

    if (this.currentStep === 3) {
      this.scheduleBranchMapsInitialization();
    }
  }

  removeRestaurant(index: number): void {
    if (
      index < 0 ||
      index >= this.restaurants.length ||
      this.restaurants.length <= 1
    ) {
      return;
    }

    this.destroyBranchMaps();

    this.restaurants.removeAt(index);

    this.restaurants.markAsDirty();

    if (this.currentStep === 3) {
      this.scheduleBranchMapsInitialization();
    }
  }

  // ============================================================
  // PLAN SELECCIONADO Y LÍMITES
  // ============================================================

  private loadPlan(): void {
    const planCode = this.registrationState.getSelectedPlan();

    if (!planCode) {
      this.router.navigate(['/']);
      return;
    }

    this.selectedPlan = planCode;

    this.loadPlanLimits(planCode);
  }

  /**
   * Consulta los planes desde el endpoint y obtiene el límite
   * correspondiente al plan seleccionado.
   */
  private loadPlanLimits(planCode: PlanCode): void {
    this.isLoadingPlanLimits = true;
    this.planLimitError = false;

    this.maxRestaurants = null;
    this.selectedPlanDetails = null;

    this.plansService.getPlans().subscribe({
      next: (response) => {
        this.plans = response.data;

        const plan = this.plans.find(
          (item) => item.code === planCode,
        );

        if (!plan) {
          console.error(
            `No se encontró el plan "${planCode}" en la respuesta del endpoint.`,
          );

          this.planLimitError = true;
          this.isLoadingPlanLimits = false;
          return;
        }

        this.selectedPlanDetails = plan;
        this.maxRestaurants = plan.limits.maxRestaurants;

        /*
         * En este formulario, null se trata como un límite
         * no disponible. No se interpreta como ilimitado.
         */
        if (
          this.maxRestaurants === null ||
          !Number.isInteger(this.maxRestaurants) ||
          this.maxRestaurants < 1
        ) {
          console.error(
            'El límite maxRestaurants del plan no es válido:',
            this.maxRestaurants,
          );

          this.planLimitError = true;
        }

        this.isLoadingPlanLimits = false;
      },

      error: (error) => {
        console.error(
          'Error consultando los planes y sus límites:',
          error,
        );

        this.maxRestaurants = null;
        this.selectedPlanDetails = null;
        this.planLimitError = true;
        this.isLoadingPlanLimits = false;
      },
    });
  }

  requiresPayment(): boolean {
    return this.selectedPlan !== 'starter';
  }

  private isValidPlanCode(
    value: string,
  ): value is PlanType {
    return (
      value === 'starter' ||
      value === 'pro' ||
      value === 'business'
    );
  }

  // ============================================================
  // CATÁLOGOS
  // ============================================================

  private loadCatalogs(): void {
    this.isLoadingCatalogs = true;
    this.catalogsError = false;

    forkJoin({
      cuisines: this.cuisinesService.getCuisines(),
      priceRanges: this.priceRangesService.getPriceRanges(),
    }).subscribe({
      next: (response) => {
        this.cuisines = response.cuisines.data;
        this.priceRanges = response.priceRanges.data;

        this.isLoadingCatalogs = false;
      },

      error: (error) => {
        console.error('Error cargando catálogos:', error);

        this.catalogsError = true;
        this.isLoadingCatalogs = false;
      },
    });
  }

  // ============================================================
  // INFORMACIÓN DE LOS PASOS
  // ============================================================

  get currentStepTitle(): string {
    switch (this.currentStep) {
      case 1:
        return 'Crea tu restaurante en PromoTable';
      case 2:
        return 'Cuéntanos sobre tu restaurante';
      case 3:
        return 'Registra las sedes de tu restaurante';
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
        return 'Define la información general de tu organización.';
      case 3:
        return 'Agrega las direcciones y ubicaciones de tus sedes.';
      case 4:
        return 'Agrega la información pública de tu organización.';
      case 5:
        return 'Crea tus credenciales para administrar tus sedes.';
      default:
        return '';
    }
  }

  get progressPercentage(): number {
    if (this.totalSteps <= 1) {
      return 100;
    }

    return Math.round(
      ((this.currentStep - 1) / (this.totalSteps - 1)) * 100,
    );
  }

  // ============================================================
  // NAVEGACIÓN
  // ============================================================

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
      this.scheduleBranchMapsInitialization();
    } else {
      this.destroyBranchMaps();
    }
  }

  previousStep(): void {
    if (this.currentStep <= 1) {
      return;
    }

    this.currentStep--;

    if (this.currentStep === 3) {
      this.scheduleBranchMapsInitialization();
    } else {
      this.destroyBranchMaps();
    }
  }

  goToStep(step: number): void {
    if (
      step < 1 ||
      step > this.totalSteps ||
      step === this.currentStep
    ) {
      return;
    }

    if (step > this.currentStep && !this.isCurrentStepValid()) {
      this.markCurrentStepAsTouched();
      return;
    }

    this.currentStep = step;

    if (this.currentStep === 3) {
      this.scheduleBranchMapsInitialization();
    } else {
      this.destroyBranchMaps();
    }
  }

  // ============================================================
  // VALIDACIÓN
  // ============================================================

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.isStepValid(['name']);

      case 2:
        return this.isStepValid([
          'restaurantName',
          'cuisineCode',
        ]);

      case 3:
        return (
          this.restaurants.valid &&
          !this.isLoadingPlanLimits &&
          !this.planLimitError &&
          this.maxRestaurants !== null &&
          this.restaurants.length <= this.maxRestaurants
        );

      case 4:
        return this.isStepValid(['priceRangeCode']);

      case 5:
        return this.isStepValid([
          'email',
          'password',
          'terms',
        ]);

      default:
        return false;
    }
  }

  private isStepValid(fields: string[]): boolean {
    return fields.every((field) => {
      const control = this.registerForm.get(field);
      return control ? control.valid : false;
    });
  }

  private markCurrentStepAsTouched(): void {
    switch (this.currentStep) {
      case 1:
        this.registerForm.get('name')?.markAsTouched();
        break;

      case 2:
        this.registerForm.get('restaurantName')?.markAsTouched();
        this.registerForm.get('cuisineCode')?.markAsTouched();
        break;

      case 3:
        this.restaurants.markAllAsTouched();
        break;

      case 4:
        this.registerForm.get('priceRangeCode')?.markAsTouched();
        break;

      case 5:
        this.registerForm.get('email')?.markAsTouched();
        this.registerForm.get('password')?.markAsTouched();
        this.registerForm.get('terms')?.markAsTouched();
        break;
    }
  }

  // ============================================================
  // MAPAS
  // ============================================================

  private scheduleBranchMapsInitialization(): void {
    if (this.branchMapInitializationTimer) {
      clearTimeout(this.branchMapInitializationTimer);
    }

    this.branchMapInitializationTimer = setTimeout(() => {
      this.initializeBranchMaps();
    }, 100);
  }

  private initializeBranchMaps(): void {
    if (this.currentStep !== 3 || !this.branchMapElements) {
      return;
    }

    this.branchMapElements.forEach((elementRef, index) => {
      const container = elementRef.nativeElement;

      if (this.branchMaps.has(index)) {
        this.branchMaps.get(index)?.map.invalidateSize();
        return;
      }

      const branch = this.restaurants.at(index);

      if (!branch) {
        return;
      }

      const latitude = this.toCoordinate(
        branch.get('latitude')?.value,
      );

      const longitude = this.toCoordinate(
        branch.get('longitude')?.value,
      );

      const hasCoordinates =
        latitude !== null && longitude !== null;

      const initialLatitude = hasCoordinates
        ? latitude
        : this.defaultLatitude;

      const initialLongitude = hasCoordinates
        ? longitude
        : this.defaultLongitude;

      const map = L.map(container, {
        center: [initialLatitude, initialLongitude],
        zoom: hasCoordinates ? 16 : 12,
      });

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        },
      ).addTo(map);

      const marker = L.marker(
        [initialLatitude, initialLongitude],
        { draggable: true },
      ).addTo(map);

      marker.on('dragend', () => {
        const position = marker.getLatLng();

        this.setBranchLocation(
          index,
          position.lat,
          position.lng,
          false,
        );
      });

      map.on('click', (event: L.LeafletMouseEvent) => {
        this.setBranchLocation(
          index,
          event.latlng.lat,
          event.latlng.lng,
        );
      });

      this.branchMaps.set(index, { map, marker });

      if (hasCoordinates) {
        this.setBranchLocation(
          index,
          initialLatitude,
          initialLongitude,
          false,
        );
      }

      setTimeout(() => map.invalidateSize(), 50);
    });
  }

  private setBranchLocation(
    index: number,
    latitude: number,
    longitude: number,
    updateMap = true,
  ): void {
    const branch = this.restaurants.at(index);

    if (!branch) {
      return;
    }

    branch.patchValue({
      latitude,
      longitude,
    });

    if (updateMap) {
      const branchMap = this.branchMaps.get(index);

      if (branchMap) {
        const position = L.latLng(latitude, longitude);

        branchMap.marker.setLatLng(position);
        branchMap.map.setView(position, 16);
      }
    }
  }

  private toCoordinate(value: unknown): number | null {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }

    const coordinate = Number(value);

    return Number.isFinite(coordinate)
      ? coordinate
      : null;
  }

  private destroyBranchMaps(): void {
    this.branchMaps.forEach(({ map }) => map.remove());
    this.branchMaps.clear();
  }

  // ============================================================
  // BÚSQUEDA DE UBICACIÓN
  // ============================================================

  async searchBranchLocation(index: number): Promise<void> {
    const branch = this.restaurants.at(index);

    if (!branch || this.isSearchingBranch !== null) {
      return;
    }

    const addressControl = branch.get('address');
    const cityControl = branch.get('city');
    const departmentControl = branch.get('department');

    const address = String(addressControl?.value ?? '').trim();
    const city = String(cityControl?.value ?? '').trim();
    const department = String(
      departmentControl?.value ?? '',
    ).trim();

    if (!address || address.length < 3) {
      addressControl?.markAsTouched();
      return;
    }

    this.isSearchingBranch = index;

    const query = [
      address,
      city,
      department,
      'Colombia',
    ].filter(Boolean).join(', ');

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      countrycodes: 'co',
    });

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('No fue posible consultar la ubicación.');
      }

      const results =
        await response.json() as GeocodingResult[];

      if (!results.length) {
        throw new Error('No se encontró la ubicación solicitada.');
      }

      const latitude = Number(results[0].lat);
      const longitude = Number(results[0].lon);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new Error('Las coordenadas recibidas no son válidas.');
      }

      this.setBranchLocation(
        index,
        latitude,
        longitude,
      );

      const branchMap = this.branchMaps.get(index);

      if (branchMap) {
        const position = L.latLng(latitude, longitude);

        branchMap.marker.setLatLng(position);
        branchMap.map.setView(position, 16);
        branchMap.map.invalidateSize();
      }
    } catch (error) {
      console.error(
        `Error buscando ubicación de la sede ${index + 1}:`,
        error,
      );
    } finally {
      this.isSearchingBranch = null;
    }
  }

  // ============================================================
  // ENVÍO DEL REGISTRO
  // ============================================================

  submit(): void {
    if (this.isSubmitting) {
      return;
    }

    if (!this.selectedPlan) {
      this.router.navigate(['/']);
      return;
    }

    if (
      this.isLoadingPlanLimits ||
      this.planLimitError ||
      this.maxRestaurants === null
    ) {
      this.currentStep = 3;
      return;
    }

    if (this.isLoadingCatalogs || this.catalogsError) {
      return;
    }

    if (
      this.restaurants.length > this.maxRestaurants
    ) {
      this.currentStep = 3;
      this.restaurants.markAllAsTouched();
      return;
    }

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      const firstInvalidStep = this.getFirstInvalidStep();

      if (firstInvalidStep !== null) {
        this.currentStep = firstInvalidStep;

        if (firstInvalidStep === 3) {
          this.scheduleBranchMapsInitialization();
        }
      }

      return;
    }

    this.isSubmitting = true;

    const formValue = this.registerForm.getRawValue();

    const request = {
      name: String(formValue.name).trim(),

      email: String(formValue.email)
        .trim()
        .toLowerCase(),

      password: formValue.password,

      terms: formValue.terms,

      restaurantName: String(
        formValue.restaurantName,
      ).trim(),

      cuisineCode: formValue.cuisineCode,

      description:
        String(formValue.description ?? '').trim() ||
        undefined,

      phone:
        String(formValue.phone ?? '').trim() ||
        undefined,

      priceRangeCode: formValue.priceRangeCode,

      website:
        String(formValue.website ?? '').trim() ||
        undefined,

      instagram:
        String(formValue.instagram ?? '').trim() ||
        undefined,

      facebook:
        String(formValue.facebook ?? '').trim() ||
        undefined,

      planCode: this.selectedPlan,

      restaurants: formValue.restaurants.map(
        (branch: Record<string, unknown>) => ({
          name: String(branch['name']).trim(),

          description:
            typeof branch['description'] === 'string' &&
            branch['description'].trim()
              ? branch['description'].trim()
              : undefined,

          phone:
            typeof branch['phone'] === 'string' &&
            branch['phone'].trim()
              ? branch['phone'].trim()
              : undefined,

          address: String(branch['address']).trim(),

          city: String(branch['city']).trim(),

          department:
            typeof branch['department'] === 'string' &&
            branch['department'].trim()
              ? branch['department'].trim()
              : undefined,

          latitude:
            this.toCoordinate(branch['latitude']) ??
            undefined,

          longitude:
            this.toCoordinate(branch['longitude']) ??
            undefined,
        }),
      ),
    } satisfies RegisterRequest;

    this.authService.register(request).subscribe({
      next: (response) => {
        const planCode = response.data.plan.code;

        if (!this.isValidPlanCode(planCode)) {
          console.error(
            'El backend devolvió un plan no válido:',
            planCode,
          );

          this.isSubmitting = false;
          return;
        }

        this.registrationState.setSelectedPlan(planCode);

        this.registrationState.setSubscriptionId(
          response.data.subscription.id,
        );

        this.authState.reset();

        this.authState.initialize().subscribe({
          next: (authenticated) => {
            if (!authenticated) {
              this.isSubmitting = false;
              return;
            }

            if (planCode === 'starter') {
              this.registrationState.clear();

              this.router.navigate(['/app/dashboard']);
              return;
            }

            this.router.navigate(['/auth/subscription']);
          },

          error: (error) => {
            console.error(
              'Error inicializando la sesión:',
              error,
            );

            this.isSubmitting = false;
          },
        });
      },

      error: (error) => {
        console.error(
          'Error registrando organización y sedes:',
          error,
        );

        this.isSubmitting = false;
      },
    });
  }

  private getFirstInvalidStep(): number | null {
    if (!this.isStepValid(['name'])) {
      return 1;
    }

    if (!this.isStepValid([
      'restaurantName',
      'cuisineCode',
    ])) {
      return 2;
    }

    if (
      !this.restaurants.valid ||
      this.maxRestaurants === null ||
      this.restaurants.length > this.maxRestaurants
    ) {
      return 3;
    }

    if (!this.isStepValid(['priceRangeCode'])) {
      return 4;
    }

    if (!this.isStepValid([
      'email',
      'password',
      'terms',
    ])) {
      return 5;
    }

    return null;
  }
}