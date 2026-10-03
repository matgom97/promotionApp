import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl =
    environment.apiUrl;

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
  ): Observable<T> {
    return this.http.get<T>(
      `${this.baseUrl}/${endpoint}`,
      {
        params,
        ...this.requestOptions,
      },
    );
  }

  // ==========================================
  // POST
  // ==========================================

  post<T>(
    endpoint: string,
    body?: unknown,
  ): Observable<T> {
    return this.http.post<T>(
      `${this.baseUrl}/${endpoint}`,
      body,
      this.requestOptions,
    );
  }

  // ==========================================
  // PUT
  // ==========================================

  put<T>(
    endpoint: string,
    body?: unknown,
  ): Observable<T> {
    return this.http.put<T>(
      `${this.baseUrl}/${endpoint}`,
      body,
      this.requestOptions,
    );
  }

  // ==========================================
  // PATCH
  // ==========================================

  patch<T>(
    endpoint: string,
    body?: unknown,
  ): Observable<T> {
    return this.http.patch<T>(
      `${this.baseUrl}/${endpoint}`,
      body,
      this.requestOptions,
    );
  }

  // ==========================================
  // DELETE
  // ==========================================

  delete<T>(
    endpoint: string,
  ): Observable<T> {
    return this.http.delete<T>(
      `${this.baseUrl}/${endpoint}`,
      this.requestOptions,
    );
  }
}