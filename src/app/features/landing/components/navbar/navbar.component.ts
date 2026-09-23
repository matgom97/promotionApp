import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
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