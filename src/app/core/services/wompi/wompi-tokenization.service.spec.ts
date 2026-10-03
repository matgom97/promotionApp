import { TestBed } from '@angular/core/testing';

import { WompiTokenizationService } from './wompi-tokenization.service';

describe('WompiTokenizationService', () => {
  let service: WompiTokenizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WompiTokenizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
