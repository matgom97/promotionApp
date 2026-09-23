import { Component } from '@angular/core';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [],
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss'
})
export class FeaturesComponent {

  features: Feature[] = [
    {
      icon: '🏷️',
      title: 'Promociones en 2 minutos',
      description:
        'Crea descuentos, 2×1, regalos y combos sin complicaciones.'
    },
    {
      icon: '▦',
      title: 'QR listo para imprimir',
      description:
        'Genera automáticamente un código QR para compartir en mesas, redes o vitrinas.'
    },
    {
      icon: '✓',
      title: 'Canjes verificados',
      description:
        'Cada cliente recibe un código único para evitar duplicados y abusos.'
    },
    {
      icon: '📊',
      title: 'Analíticas reales',
      description:
        'Conoce vistas, canjes y conversiones para saber qué promociones funcionan.'
    },
    {
      icon: '👥',
      title: 'Clientes y segmentos',
      description:
        'Identifica patrones de consumo y crea promociones para diferentes segmentos.'
    },
    {
      icon: '⚙',
      title: 'Equipo con roles',
      description:
        'Gestiona el acceso de tu equipo y controla qué puede hacer cada usuario.'
    }
  ];

}