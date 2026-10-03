import { TestBed } from '@angular/core/testing';

import { PriceRangeService } from './price-range.service';

describe('PriceRangeService', () => {
  let service: PriceRangeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PriceRangeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
