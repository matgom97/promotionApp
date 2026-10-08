import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../../../shared/icon/icon.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent {

}
