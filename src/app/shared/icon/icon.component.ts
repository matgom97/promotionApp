import {
  ChangeDetectionStrategy,
  Component,
  Input
} from '@angular/core';

import {
  ICONS,
  IconFill,
  IconName,
  IconWeight
} from './icons';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="material-symbols-rounded"
      [attr.role]="label ? 'img' : null"
      [attr.aria-hidden]="label ? null : 'true'"
      [attr.aria-label]="label || null"
      [style.font-size.px]="size"
      [style.font-variation-settings]="variationSettings"
    >{{ ligature }}</span>
  `
})
export class IconComponent {

  @Input({ required: true })
  name!: IconName;

  @Input()
  size = 24;

  /**
   * Relleno del icono. Un valor de 'FILL' entre 0 y 1.
   */
  @Input()
  fill: IconFill = 0;

  @Input()
  weight: IconWeight = 500;

  @Input()
  grade = 0;

  /**
   * Nombre accesible. Sin label el icono es decorativo
   * y se oculta a lectores de pantalla.
   */
  @Input()
  label?: string;

  get ligature(): string {
    return ICONS[this.name];
  }

  get variationSettings(): string {
    return [
      `'FILL' var(--icon-fill, ${this.fill})`,
      `'wght' ${this.weight}`,
      `'GRAD' ${this.grade}`,
      `'opsz' ${this.size}`
    ].join(', ');
  }

}