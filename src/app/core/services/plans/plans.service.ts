import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';
import { Plan } from '../../models/plan.model';

export interface PlansResponse {
  data: Plan[];
}

@Injectable({
  providedIn: 'root'
})
export class PlansService {

  constructor(
    private readonly api: ApiService
  ) {}

  getPlans(): Observable<PlansResponse> {
    return this.api.get<PlansResponse>('plans');
  }
}