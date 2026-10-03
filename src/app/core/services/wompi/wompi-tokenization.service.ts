import { Injectable } from '@angular/core';

import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WompiTokenizationService {
  private readonly widgetUrl =
    'https://checkout.wompi.co/widget.js';

  private widgetLoaded = false;

  async loadWidget(): Promise<void> {
    if (this.widgetLoaded) {
      return;
    }

    const existingScript =
      document.querySelector(
        `script[src="${this.widgetUrl}"]`,
      );

    if (existingScript) {
      this.widgetLoaded = true;
      return;
    }

    await new Promise<void>(
      (resolve, reject) => {
        const script =
          document.createElement('script');

        script.src = this.widgetUrl;
        script.async = true;

        script.onload = () => {
          this.widgetLoaded = true;
          resolve();
        };

        script.onerror = () => {
          reject(
            new Error(
              'No se pudo cargar el Widget de Wompi.',
            ),
          );
        };

        document.head.appendChild(script);
      },
    );
  }

  getPublicKey(): string {
    return environment.wompi.publicKey;
  }
}