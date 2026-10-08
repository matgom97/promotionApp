import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../../../shared/icon/icon.component';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './cta.component.html',
  styleUrl: './cta.component.scss'
})
export class CtaComponent {}