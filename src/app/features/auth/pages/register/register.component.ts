import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { DecimalPipe } from '@angular/common';

import * as L from 'leaflet';



type PlanType = 'starter' | 'pro' | 'business';

interface RegisterStep {
  number: number;
  label: string;
}

interface CuisineOption {
  value: string;
  label: string;
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
export class RegisterComponent implements OnInit {

  // ==========================================
  // MAPA
  // ==========================================
  @ViewChild('map')
  mapElement!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private marker?: L.Marker;

  isSearchingLocation = false;

  selectedLocation: {
    lat: number;
    lng: number;
  } | null = null;

  // ==========================================
  // FORMULARIO
  // ==========================================

  registerForm!: FormGroup;


  // ==========================================
  // PLAN
  // ==========================================

  selectedPlan: PlanType = 'starter';

  planName = 'Starter';

  planDescription =
    'Comienza gratis y crea tus primeras promociones para tu restaurante.';


  // ==========================================
  // ESTADO
  // ==========================================

  isSubmitting = false;


  // ==========================================
  // WIZARD
  // ==========================================

  currentStep = 1;

  totalSteps = 5;


  steps: RegisterStep[] = [
    {
      number: 1,
      label: 'Tú'
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
      label: 'Visibilidad'
    },
    {
      number: 5,
      label: 'Cuenta'
    }
  ];


  // ==========================================
  // TIPOS DE COCINA
  // ==========================================

  cuisines: CuisineOption[] = [

    {
      value: 'colombian',
      label: 'Colombiana'
    },

    {
      value: 'parrilla',
      label: 'Parrilla'
    },

    {
      value: 'italian',
      label: 'Italiana'
    },

    {
      value: 'mexican',
      label: 'Mexicana'
    },

    {
      value: 'asian',
      label: 'Asiática'
    },

    {
      value: 'seafood',
      label: 'Mariscos'
    },

    {
      value: 'fast-food',
      label: 'Comida rápida'
    },

    {
      value: 'cafe',
      label: 'Café'
    },

    {
      value: 'other',
      label: 'Otra'
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

    this.loadPlan();

  }


  // ==========================================
  // CREAR FORMULARIO
  // ==========================================

  private createForm(): void {

    this.registerForm = this.fb.group({

      // ========================================
      // PASO 1
      // ========================================

      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],


      // ========================================
      // PASO 2
      // ========================================

      restaurantName: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],

      cuisine: [
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
        ''
      ],


      // ========================================
      // PASO 3
      // ========================================

      address: [
        '',
        Validators.required
      ],

      city: [
        '',
        Validators.required
      ],

      department: [
        ''
      ],

      latitude: [
        null
      ],

      longitude: [
        null
      ],


      // ========================================
      // PASO 4
      // ========================================

      priceRange: [
        '',
        Validators.required
      ],

      website: [
        ''
      ],

      instagram: [
        ''
      ],

      facebook: [
        ''
      ],


      // ========================================
      // PASO 5
      // ========================================

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ],

      terms: [
        false,
        Validators.requiredTrue
      ]

    });

  }


  // ==========================================
  // PLAN
  // ==========================================

  private loadPlan(): void {

    this.route.queryParamMap.subscribe(params => {

      const plan = params.get('plan');

      if (
        plan === 'starter' ||
        plan === 'pro' ||
        plan === 'business'
      ) {

        this.selectedPlan = plan;

      } else {

        this.selectedPlan = 'starter';

      }

      this.updatePlanInformation();

    });

  }


  // ==========================================
  // INFORMACIÓN DEL PLAN
  // ==========================================

  private updatePlanInformation(): void {

    switch (this.selectedPlan) {

      case 'starter':

        this.planName = 'Starter';

        this.planDescription =
          'Comienza gratis y crea tus primeras promociones para tu restaurante.';

        break;


      case 'pro':

        this.planName = 'Pro';

        this.planDescription =
          '14 días de prueba del plan Pro. Agrega tu tarjeta para comenzar.';

        break;


      case 'business':

        this.planName = 'Business';

        this.planDescription =
          'Activa el plan Business agregando una tarjeta para comenzar.';

        break;

    }

  }


  // ==========================================
  // ¿REQUIERE PAGO?
  // ==========================================

  requiresPayment(): boolean {

    return this.selectedPlan !== 'starter';

  }


  // ==========================================
  // TÍTULO DEL PASO
  // ==========================================

  get currentStepTitle(): string {

    switch (this.currentStep) {

      case 1:
        return 'Crea tu cuenta';

      case 2:
        return 'Tu restaurante';

      case 3:
        return 'Encuentra tu restaurante';

      case 4:
        return 'Haz que te encuentren';

      case 5:
        return 'Casi terminamos';

      default:
        return 'Crea tu cuenta';

    }

  }


  // ==========================================
  // DESCRIPCIÓN DEL PASO
  // ==========================================

  get currentStepDescription(): string {

    switch (this.currentStep) {

      case 1:
        return 'Empecemos con algunos datos sobre ti.';

      case 2:
        return 'Cuéntanos un poco sobre tu restaurante.';

      case 3:
        return 'Indícanos dónde pueden encontrarte tus clientes.';

      case 4:
        return 'Completa la información que mostraremos públicamente.';

      case 5:
        return this.planDescription;

      default:
        return this.planDescription;

    }

  }


  // ==========================================
  // PORCENTAJE DE PROGRESO
  // ==========================================

  get progressPercentage(): number {

    return (
      ((this.currentStep - 1) /
        (this.totalSteps - 1)) *
      100
    );

  }


  // ==========================================
  // SIGUIENTE PASO
  // ==========================================

  nextStep(): void {

    if (!this.validateCurrentStep()) {
      return;
    }

    if (this.currentStep < this.totalSteps) {

      this.currentStep++;

      if (this.currentStep === 3) {
        setTimeout(() => {
          this.initializeMap();
        });
      }
    }
  }


  // ==========================================
  // PASO ANTERIOR
  // ==========================================

  previousStep(): void {

    if (this.currentStep > 1) {

      this.currentStep--;

      if (this.currentStep === 3) {
        setTimeout(() => {
          this.initializeMap();
        });
      }
    }
  }
  // ==========================================
  // INICIALIZAR MAPA
  // ==========================================

  // ==========================================
  // INICIALIZAR MAPA
  // ==========================================

  private initializeMap(): void {
  if (!this.mapElement?.nativeElement) {
    console.warn('El elemento del mapa todavía no existe.');
    return;
  }

  if (this.map) {
    setTimeout(() => {
      this.map?.invalidateSize({ pan: false });

      // Si ya tenemos coordenadas seleccionadas, las mostramos
      if (this.selectedLocation) {
        this.updateMarker(
          this.selectedLocation.lat,
          this.selectedLocation.lng
        );
      }
    }, 300);

    return;
  }

  const defaultLat = 10.9685;
  const defaultLng = -74.7813;

  this.map = L.map(this.mapElement.nativeElement, {
    center: [defaultLat, defaultLng],
    zoom: 13,
    zoomControl: true,
    attributionControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(this.map);

  // Esperar a que el contenedor sea completamente visible
  setTimeout(() => {
    this.map?.invalidateSize({ pan: false });

    if (this.selectedLocation) {
      this.updateMarker(
        this.selectedLocation.lat,
        this.selectedLocation.lng
      );
    }
  }, 500);
}

  // ==========================================
  // ESTABLECER UBICACIÓN
  // ==========================================

  private setLocation(
    lat: number,
    lng: number
  ): void {

    this.selectedLocation = {
      lat,
      lng
    };

    this.registerForm.patchValue({
      latitude: lat,
      longitude: lng
    });
  }


  // ==========================================
  // VALIDAR PASO ACTUAL
  // ==========================================

  private validateCurrentStep(): boolean {

    let fields: string[] = [];


    switch (this.currentStep) {

      // ========================================
      // PASO 1
      // ========================================

      case 1:

        fields = [
          'name'
        ];

        break;


      // ========================================
      // PASO 2
      // ========================================

      case 2:

        fields = [
          'restaurantName',
          'cuisine',
          'description'
        ];

        break;


      // ========================================
      // PASO 3
      // ========================================

      case 3:

        fields = [
          'address',
          'city'
        ];

        break;


      // ========================================
      // PASO 4
      // ========================================

      case 4:

        fields = [
          'priceRange'
        ];

        break;


      // ========================================
      // PASO 5
      // ========================================

      case 5:

        fields = [
          'email',
          'password',
          'terms'
        ];

        break;

    }


    fields.forEach(field => {

      this.registerForm
        .get(field)
        ?.markAsTouched();

    });


    return fields.every(field => {

      return this.registerForm
        .get(field)
        ?.valid;

    });

  }


  // ==========================================
  // SUBMIT FINAL
  // ==========================================

  submit(): void {

    /*
     * Verificamos todo el formulario,
     * no solamente el paso actual.
     */

    if (this.registerForm.invalid) {

      this.markAllFieldsAsTouched();

      return;

    }


    this.isSubmitting = true;


    // ==========================================
    // DATOS COMPLETOS
    // ==========================================

    const registrationData = {

      ...this.registerForm.value,

      plan: this.selectedPlan

    };


    console.log(
      'Registro completo:',
      registrationData
    );


    // ==========================================
    // PRO / BUSINESS
    // ==========================================

    if (this.requiresPayment()) {

      /*
       * Guardamos temporalmente los datos
       * necesarios para continuar al pago.
       *
       * IMPORTANTE:
       * NO guardamos password.
       * NO guardamos tarjeta.
       * NO guardamos CVV.
       */

      const pendingRegistration = {

        plan: this.selectedPlan,

        name:
          registrationData.name,

        restaurantName:
          registrationData.restaurantName,

        cuisine:
          registrationData.cuisine,

        description:
          registrationData.description,

        phone:
          registrationData.phone,

        address:
          registrationData.address,

        city:
          registrationData.city,

        department:
          registrationData.department,

        latitude:
          registrationData.latitude,

        longitude:
          registrationData.longitude,

        priceRange:
          registrationData.priceRange,

        website:
          registrationData.website,

        instagram:
          registrationData.instagram,

        facebook:
          registrationData.facebook,

        email:
          registrationData.email

      };


      sessionStorage.setItem(
        'pending_registration',
        JSON.stringify(
          pendingRegistration
        )
      );


      this.router.navigate(
        ['/auth/subscription'],
        {
          queryParams: {
            plan: this.selectedPlan
          }
        }
      );

      return;

    }


    // ==========================================
    // STARTER
    // ==========================================

    /*
     * Por ahora simulamos continuar
     * al dashboard.
     *
     * Posteriormente:
     *
     * Register
     *    ↓
     * Laravel
     *    ↓
     * User + Restaurant
     *    ↓
     * Dashboard
     */

    this.router.navigate([
      '/app/dashboard'
    ]);

  }


  // ==========================================
  // MARCAR TODO COMO TOCADO
  // ==========================================

  private markAllFieldsAsTouched(): void {

    Object.keys(
      this.registerForm.controls
    ).forEach(field => {

      this.registerForm
        .get(field)
        ?.markAsTouched();

    });

  }

  // ==========================================
  // BUSCAR UBICACIÓN
  // ==========================================

  async searchLocation(): Promise<void> {
  const address = this.registerForm.get('address')?.value;
  const city = this.registerForm.get('city')?.value;
  const department = this.registerForm.get('department')?.value;

  if (!address || !city) {
    alert('Ingresa la dirección y la ciudad.');
    return;
  }

  this.isSearchingLocation = true;

  try {
    const query = [
      address,
      city,
      department,
      'Colombia'
    ]
      .filter(Boolean)
      .join(', ');

    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?format=json` +
      `&limit=1` +
      `&countrycodes=co` +
      `&q=${encodeURIComponent(query)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('No fue posible buscar la dirección.');
    }

    const results = await response.json();

    if (!results.length) {
      alert('No encontramos esa dirección. Intenta con una dirección más específica.');
      return;
    }

    const result = results[0];

    const lat = Number(result.lat);
    const lng = Number(result.lon);

    console.log('Ubicación encontrada:', {
      lat,
      lng,
      displayName: result.display_name
    });

    // Asegurarnos de que el mapa exista
    if (!this.map) {
      this.initializeMap();

      await new Promise(resolve =>
        setTimeout(resolve, 500)
      );
    }

    if (!this.map) {
      throw new Error('No fue posible inicializar el mapa.');
    }

    // Crear/mover el marcador
    this.updateMarker(lat, lng);

  } catch (error) {
    console.error('Error buscando ubicación:', error);

    alert(
      'No fue posible encontrar la ubicación. ' +
      'Verifica la dirección e intenta nuevamente.'
    );

  } finally {
    this.isSearchingLocation = false;
  }
}

  // ==========================================
  // ACTUALIZAR MARCADOR
  // ==========================================

  private updateMarker(lat: number, lng: number): void {
  if (!this.map) {
    return;
  }

  if (!this.marker) {
    this.marker = L.marker(
      [lat, lng],
      {
        draggable: true,
        icon: this.createMarkerIcon()
      }
    ).addTo(this.map);

    this.marker.on('dragend', () => {
      if (!this.marker) {
        return;
      }

      const position = this.marker.getLatLng();

      this.setLocation(
        position.lat,
        position.lng
      );
    });
  } else {
    this.marker.setLatLng([lat, lng]);
  }

  this.map.setView(
    [lat, lng],
    17,
    {
      animate: true
    }
  );

  this.setLocation(lat, lng);

  setTimeout(() => {
    this.map?.invalidateSize({ pan: false });
  }, 200);
}

  private createMarkerIcon(): L.DivIcon {
  return L.divIcon({
    className: 'restaurant-map-marker',
    html: `
      <div class="restaurant-map-marker__pin">
        <div class="restaurant-map-marker__dot"></div>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50]
  });
}

}