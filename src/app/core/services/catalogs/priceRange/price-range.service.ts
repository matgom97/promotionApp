import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../api/api.service';

export interface PriceRange {
  code: string;
  symbol: string;
  name: string;
}

export interface PriceRangesResponse {
  data: PriceRange[];
}

@Injectable({
  providedIn: 'root'
})
export class PriceRangesService {

  constructor(
    private readonly api: ApiService
  ) {}

  getPriceRanges(): Observable<PriceRangesResponse> {
    return this.api.get<PriceRangesResponse>('price-ranges');
  }
}