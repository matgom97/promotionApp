import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../../../shared/icon/icon.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements AfterViewInit {

  @ViewChild('heroVideo')
  private readonly heroVideo!: ElementRef<HTMLVideoElement>;

  /**
   * El atributo muted no alcanza: Angular crea el elemento y despues
   * asigna los atributos, y en ese momento el atributo solo cambia
   * defaultMuted. Hay que forzar la propiedad para que el navegador
   * no bloquee el autoplay.
   */
  ngAfterViewInit(): void {
    const video = this.heroVideo.nativeElement;

    video.muted = true;
    video.volume = 0;

    void video.play().catch(() => {
      // El navegador puede rechazar el autoplay: se ignora en silencio.
    });
  }

}
