import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../api/api.service';

export interface Cuisine {
  code: string;
  name: string;
}

export interface CuisinesResponse {
  data: Cuisine[];
}

@Injectable({
  providedIn: 'root'
})
export class CuisinesService {

  constructor(
    private readonly api: ApiService
  ) {}

  getCuisines(): Observable<CuisinesResponse> {
    return this.api.get<CuisinesResponse>('cuisines');
  }
}