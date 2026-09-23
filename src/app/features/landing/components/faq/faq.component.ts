import { Component } from '@angular/core';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent {

  faqs: FaqItem[] = [
    {
      question: '¿Necesito instalar algo en el restaurante?',
      answer:
        'No. PromoTable funciona desde el navegador. Puedes administrar tus promociones desde un computador, tablet o teléfono.'
    },
    {
      question: '¿Cómo evito que se abuse de una promoción?',
      answer:
        'Cada canje genera un código único que puede validarse en el restaurante. De esta forma puedes controlar cuándo y cómo se utiliza una promoción.'
    },
    {
      question: '¿Puedo tener varios usuarios?',
      answer:
        'Sí. Puedes permitir que diferentes miembros de tu equipo accedan a la plataforma y asignarles diferentes roles y permisos.'
    },
    {
      question: '¿Qué datos veo de cada promoción?',
      answer:
        'Puedes consultar métricas como visualizaciones, canjes y conversión para entender el rendimiento de cada promoción.'
    }
  ];

  openIndex: number | null = null;

  toggle(index: number): void {
    this.openIndex = this.openIndex === index ? null : index;
  }

}