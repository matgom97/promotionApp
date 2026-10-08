import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../../../shared/icon/icon.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {



  isMenuOpen = false;

  toggleMenu(): void {
    console.log("aqui estoy");
    
    this.isMenuOpen = !this.isMenuOpen;

  }

  closeMenu(): void {

      console.log("Hola");
  
    this.isMenuOpen = false;

  }
}