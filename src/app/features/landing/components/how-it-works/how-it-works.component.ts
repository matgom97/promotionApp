import { Component } from '@angular/core';

interface Step {
  number: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [],
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.scss'
})
export class HowItWorksComponent {

  steps: Step[] = [
    {
      number: '01',
      title: 'Crea tu promoción',
      description:
        'Define el descuento, beneficio, vigencia y condiciones de tu promoción.',
      icon: '✦'
    },
    {
      number: '02',
      title: 'Publica y comparte el QR',
      description:
        'Genera tu código QR y colócalo en tus mesas, redes sociales o canales digitales.',
      icon: '▦'
    },
    {
      number: '03',
      title: 'El cliente obtiene su código',
      description:
        'El cliente descubre la promoción, se registra y obtiene un código único.',
      icon: '✓'
    },
    {
      number: '04',
      title: 'Valida y mide',
      description:
        'Valida el código en el restaurante y consulta los resultados de la promoción.',
      icon: '↗'
    }
  ];

}