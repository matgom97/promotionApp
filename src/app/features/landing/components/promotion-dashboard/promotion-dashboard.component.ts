import { Component } from '@angular/core';

import {
  Promotion,
  PromotionCardComponent
} from '../promotion-card/promotion-card.component';

@Component({
  selector: 'app-promotion-dashboard',
  standalone: true,
  imports: [PromotionCardComponent],
  templateUrl: './promotion-dashboard.component.html',
  styleUrl: './promotion-dashboard.component.scss'
})
export class PromotionDashboardComponent {

  promotions: Promotion[] = [
    {
      title: 'Menú mediodía 2×1',
      description: 'De lunes a viernes · 12:00 - 15:00',
      views: 1264,
      redemptions: 84,
      conversion: 6.6,
      icon: '🍽️',
      status: 'active'
    },
    {
      title: '-25% en carta de brasa',
      description: 'Todos los martes y miércoles',
      views: 903,
      redemptions: 41,
      conversion: 4.5,
      icon: '🔥',
      status: 'active'
    },
    {
      title: 'Postre de regalo',
      description: 'Con consumos superiores a $80.000',
      views: 612,
      redemptions: 63,
      conversion: 10.3,
      icon: '🍰',
      status: 'active'
    }
  ];

  get totalRedemptions(): number {
    return this.promotions.reduce(
      (total, promotion) => total + promotion.redemptions,
      0
    );
  }

}