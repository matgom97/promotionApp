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
      icon: 'assets/icons/promo.svg',
      title: 'Promociones en 2 minutos',
      description:
        'Crea descuentos, 2×1, regalos y combos sin complicaciones.'
    },
    {
      icon: 'assets/icons/qr.svg',
      title: 'QR listo para imprimir',
      description:
        'Genera automáticamente un código QR para compartir en mesas, redes o vitrinas.'
    },
    {
      icon: 'assets/icons/check.svg',
      title: 'Canjes verificados',
      description:
        'Cada cliente recibe un código único para evitar duplicados y abusos.'
    },
    {
      icon: 'assets/icons/chart.svg',
      title: 'Analíticas reales',
      description:
        'Conoce vistas, canjes y conversiones para saber qué promociones funcionan.'
    },
    {
      icon: 'assets/icons/group.svg',
      title: 'Clientes y segmentos',
      description:
        'Identifica patrones de consumo y crea promociones para diferentes segmentos.'
    },
    {
      icon: 'assets/icons/setting.svg',
      title: 'Equipo con roles',
      description:
        'Gestiona el acceso de tu equipo y controla qué puede hacer cada usuario.'
    }
  ];

}