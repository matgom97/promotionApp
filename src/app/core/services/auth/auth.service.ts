import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';


export interface MeResponse {
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
    } | null;
    membership: {
      id: string;
      role: string;
    } | null;
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  terms: boolean;

  restaurantName: string;
  cuisineCode: string;
  description: string;
  phone?: string;

  address: string;
  city: string;
  department?: string;
  latitude?: number;
  longitude?: number;

  priceRangeCode: string;
  website?: string;
  instagram?: string;
  facebook?: string;

  planCode?: string;
}

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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;

  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      status: string;
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
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private readonly api: ApiService,
  ) { }

  register(
    data: RegisterRequest,
  ): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>(
      'auth/register',
      data,
    );
  }

  login(
    data: LoginRequest,
  ): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(
      'auth/login',
      data,
    );
  }

  refresh(): Observable<unknown> {
    return this.api.post('auth/refresh');
  }

  logout(): Observable<unknown> {
    return this.api.post('auth/logout');
  }

  me(): Observable<MeResponse> {
  return this.api.get<MeResponse>('auth/me');
}
}