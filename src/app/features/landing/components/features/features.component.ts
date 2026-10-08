import { Component } from '@angular/core';

import { IconComponent } from '../../../../shared/icon/icon.component';
import { IconName } from '../../../../shared/icon/icons';

interface Feature {
  icon: IconName;
  title: string;
  description: string;
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss'
})
export class FeaturesComponent {

  features: Feature[] = [
    {
      icon: 'sell',
      title: 'Promociones en 2 minutos',
      description:
        'Crea descuentos, 2×1, regalos y combos sin complicaciones.'
    },
    {
      icon: 'qr_code_2',
      title: 'QR listo para imprimir',
      description:
        'Genera automáticamente un código QR para compartir en mesas, redes o vitrinas.'
    },
    {
      icon: 'verified',
      title: 'Canjes verificados',
      description:
        'Cada cliente recibe un código único para evitar duplicados y abusos.'
    },
    {
      icon: 'monitoring',
      title: 'Analíticas reales',
      description:
        'Conoce vistas, canjes y conversiones para saber qué promociones funcionan.'
    },
    {
      icon: 'groups',
      title: 'Clientes y segmentos',
      description:
        'Identifica patrones de consumo y crea promociones para diferentes segmentos.'
    },
    {
      icon: 'settings',
      title: 'Equipo con roles',
      description:
        'Gestiona el acceso de tu equipo y controla qué puede hacer cada usuario.'
    }
  ];

}