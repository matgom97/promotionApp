import { Component } from '@angular/core';
import { FooterComponent } from '../../features/landing/components/footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../features/landing/components/navbar/navbar.component';

@Component({
  selector: 'app-landing-layout',
  standalone: true,
   imports: [

    RouterOutlet,

    NavbarComponent,

    FooterComponent

  ],
  templateUrl: './landing-layout.component.html',
  styleUrl: './landing-layout.component.scss'
})
export class LandingLayoutComponent {

}
