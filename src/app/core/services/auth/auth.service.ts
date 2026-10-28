import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';

/**
 * Usuario autenticado.
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  status: string;
  createdAt?: string;
}

/**
 * Membresía del usuario dentro de un restaurante.
 */
export interface RestaurantMembership {
  id: string;
  role: string;
}

/**
 * Restaurante al que tiene acceso el usuario.
 * Cada restaurante pertenece a una organización.
 */
export interface AuthRestaurant {
  id: string;
  organizationId: string;
  name: string;
  city: string;
  status: string;
  membership: RestaurantMembership;
}

/**
 * Respuesta del endpoint GET auth/me.
 */
export interface MeResponse {
  message: string;

  data: {
    user: AuthUser;
    restaurants: AuthRestaurant[];
  };
}

/**
 * Datos de una sede que se registra dentro de la organización.
 */
export interface RegisterRestaurantRequest {
  name: string;
  description?: string;
  phone?: string;

  address: string;
  city: string;
  department?: string;

  latitude?: number;
  longitude?: number;
}

/**
 * Datos requeridos para registrar una cuenta,
 * una organización y sus sedes.
 */
export interface RegisterRequest {
  // Datos del propietario
  name: string;
  email: string;
  password: string;
  terms: boolean;

  // Información general de la organización
  restaurantName: string;
  cuisineCode: string;
  description?: string;
  phone?: string;

  // Configuración comercial
  priceRangeCode: string;
  planCode?: string;

  // Información pública
  website?: string;
  instagram?: string;
  facebook?: string;

  // Una o varias sedes
  restaurants: RegisterRestaurantRequest[];
}

/**
 * Respuesta del endpoint auth/register.
 */
export interface RegisterResponse {
  message: string;

  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      status: string;
      createdAt: string;
    };

    restaurant: {
      id: string;
      name: string;
      city: string;
      status: string;
    };

    membership: {
      id: string;
      role: string;
    };

    subscription: {
      id: string;
      status: string;
      startsAt: string;
      trialEndsAt: string | null;
    };

    plan: {
      code: string;
    };
  };
}

/**
 * Credenciales para iniciar sesión.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Respuesta del endpoint POST auth/login.
 */
export interface LoginResponse {
  message: string;

  data: {
    user: AuthUser;
    restaurants: AuthRestaurant[];
  };
}

/**
 * Servicio de autenticación.
 *
 * Centraliza las peticiones de registro, inicio de sesión,
 * renovación de sesión, cierre de sesión y consulta del usuario.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private readonly api: ApiService,
  ) {}

  /**
   * Registra un usuario y su restaurante.
   */
  register(
    data: RegisterRequest,
  ): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>(
      'auth/register',
      data,
    );
  }

  /**
   * Inicia sesión y obtiene los restaurantes
   * a los que tiene acceso el usuario.
   */
  login(
    data: LoginRequest,
  ): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(
      'auth/login',
      data,
    );
  }

  /**
   * Renueva la sesión autenticada.
   */
  refresh(): Observable<unknown> {
    return this.api.post('auth/refresh');
  }

  /**
   * Cierra la sesión del usuario.
   */
  logout(): Observable<unknown> {
    return this.api.post('auth/logout');
  }

  /**
   * Obtiene los datos del usuario autenticado
   * y sus restaurantes disponibles.
   */
  me(): Observable<MeResponse> {
    return this.api.get<MeResponse>('auth/me');
  }
}