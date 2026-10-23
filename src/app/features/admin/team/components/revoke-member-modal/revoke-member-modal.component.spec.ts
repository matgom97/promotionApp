import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevokeMemberModalComponent } from './revoke-member-modal.component';

describe('RevokeMemberModalComponent', () => {
  let component: RevokeMemberModalComponent;
  let fixture: ComponentFixture<RevokeMemberModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevokeMemberModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevokeMemberModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
