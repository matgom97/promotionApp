import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface Promotion {
  title: string;
  description: string;
  views: number;
  redemptions: number;
  conversion: number;
  icon: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-promotion-card',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './promotion-card.component.html',
  styleUrl: './promotion-card.component.scss'
})
export class PromotionCardComponent {

  @Input({ required: true })
  promotion!: Promotion;

}