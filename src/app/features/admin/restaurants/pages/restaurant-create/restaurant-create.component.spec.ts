import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestaurantCreateComponent } from './restaurant-create.component';

describe('RestaurantCreateComponent', () => {
  let component: RestaurantCreateComponent;
  let fixture: ComponentFixture<RestaurantCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestaurantCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
