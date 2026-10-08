import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { IconComponent } from '../../../../shared/icon/icon.component';
import { IconName } from '../../../../shared/icon/icons';

export interface Promotion {
  title: string;
  description: string;
  views: number;
  redemptions: number;
  conversion: number;
  icon: IconName;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-promotion-card',
  standalone: true,
  imports: [DecimalPipe, IconComponent],
  templateUrl: './promotion-card.component.html',
  styleUrl: './promotion-card.component.scss'
})
export class PromotionCardComponent {

  @Input({ required: true })
  promotion!: Promotion;

}