import { Injectable } from '@angular/core';

import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WompiTokenizationService {
  private readonly widgetUrl =
    'https://checkout.wompi.co/widget.js';

  private widgetLoadPromise?: Promise<void>;

  loadWidget(): Promise<void> {
    if (this.widgetLoadPromise) {
      return this.widgetLoadPromise;
    }

    this.widgetLoadPromise = new Promise<void>(
      (resolve, reject) => {
        const existingScript =
          document.querySelector<HTMLScriptElement>(
            `script[src="${this.widgetUrl}"]`,
          );

        if (existingScript) {
          if (existingScript.dataset['loaded'] === 'true') {
            resolve();
            return;
          }

          existingScript.addEventListener(
            'load',
            () => {
              existingScript.dataset['loaded'] = 'true';
              resolve();
            },
            { once: true },
          );

          existingScript.addEventListener(
            'error',
            () => {
              this.widgetLoadPromise = undefined;

              reject(
                new Error(
                  'No se pudo cargar el Widget de Wompi.',
                ),
              );
            },
            { once: true },
          );

          return;
        }

        const script = document.createElement('script');

        script.src = this.widgetUrl;
        script.async = true;

        script.onload = () => {
          script.dataset['loaded'] = 'true';
          resolve();
        };

        script.onerror = () => {
          this.widgetLoadPromise = undefined;

          reject(
            new Error(
              'No se pudo cargar el Widget de Wompi.',
            ),
          );
        };

        document.head.appendChild(script);
      },
    );

    return this.widgetLoadPromise;
  }

  getPublicKey(): string {
    return environment.wompi.publicKey;
  }
}