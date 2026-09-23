import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  featured: boolean;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss'
})
export class PricingComponent {

  plans: PricingPlan[] = [
    {
      name: 'Starter',
      description: 'Para restaurantes que están comenzando.',
      price: '0',
      period: 'mes',
      features: [
        'Hasta 3 promociones activas',
        'Códigos QR',
        'Canjes verificados',
        'Analíticas básicas'
      ],
      buttonText: 'Empezar gratis',
      featured: false
    },
    {
      name: 'Pro',
      description: 'Para restaurantes que quieren crecer.',
      price: '39',
      period: 'mes',
      features: [
        'Promociones ilimitadas',
        'Códigos QR personalizados',
        'Analíticas avanzadas',
        'Segmentación de clientes',
        'Usuarios y roles'
      ],
      buttonText: 'Empezar ahora',
      featured: true
    },
    {
      name: 'Business',
      description: 'Para equipos y operaciones más grandes.',
      price: '89',
      period: 'mes',
      features: [
        'Todo lo incluido en Pro',
        'Múltiples restaurantes',
        'Reportes avanzados',
        'Gestión de equipos',
        'Soporte prioritario'
      ],
      buttonText: 'Empezar business',
      featured: false
    }
  ];

}