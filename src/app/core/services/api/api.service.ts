import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface ApiRequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  private readonly requestOptions = {
    withCredentials: true,
  };

  constructor(
    private readonly http: HttpClient,
  ) {}

  // ==========================================
  // GET
  // ==========================================

  get<T>(
    endpoint: string,
    params?: HttpParams,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.http.get<T>(
      `${this.baseUrl}/${endpoint}`,
      {
        ...this.requestOptions,
        ...options,
        params: options?.params ?? params,
      },
    );
  }

  // ==========================================
  // POST
  // ==========================================

  post<T>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.http.post<T>(
      `${this.baseUrl}/${endpoint}`,
      body,
      {
        ...this.requestOptions,
        ...options,
      },
    );
  }

  // ==========================================
  // PUT
  // ==========================================

  put<T>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.http.put<T>(
      `${this.baseUrl}/${endpoint}`,
      body,
      {
        ...this.requestOptions,
        ...options,
      },
    );
  }

  // ==========================================
  // PATCH
  // ==========================================

  patch<T>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.http.patch<T>(
      `${this.baseUrl}/${endpoint}`,
      body,
      {
        ...this.requestOptions,
        ...options,
      },
    );
  }

  // ==========================================
  // DELETE
  // ==========================================

  delete<T>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.http.delete<T>(
      `${this.baseUrl}/${endpoint}`,
      {
        ...this.requestOptions,
        ...options,
      },
    );
  }
}