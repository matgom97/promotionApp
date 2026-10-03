import { Injectable } from '@angular/core';

import {
  Observable,
  from,
} from 'rxjs';

import { environment } from '../../../../environments/environment';


interface WompiInitializeData {

  sessionId: string;

  deviceData?: {

    deviceID?: string;

  };

}


interface WompiGlobal {

  initialize(
    callback: (
      data: WompiInitializeData,
      error: unknown,
    ) => void,
  ): void;

}


declare global {

  interface Window {

    $wompi?: WompiGlobal;

  }

}


@Injectable({
  providedIn: 'root',
})
export class WompiService {

  private readonly scriptUrl =
    'https://wompijs.wompi.com/libs/js/v1.js';

  private scriptLoadingPromise:
    Promise<void> | null = null;


  initializeSession():
    Observable<string> {

    return from(
      this.initialize(),
    );

  }


  private async initialize():
    Promise<string> {

    await this.loadScript();


    if (!window.$wompi) {

      throw new Error(
        'Wompi JS no está disponible.',
      );

    }


    return new Promise<string>(
      (resolve, reject) => {

        window.$wompi!.initialize(
          (
            data,
            error,
          ) => {

            if (error) {

              reject(error);

              return;

            }


            if (!data?.sessionId) {

              reject(
                new Error(
                  'Wompi no devolvió sessionId.',
                ),
              );

              return;

            }


            resolve(
              data.sessionId,
            );

          },
        );

      },
    );

  }


  private loadScript():
    Promise<void> {

    if (window.$wompi) {

      return Promise.resolve();

    }


    if (this.scriptLoadingPromise) {

      return this.scriptLoadingPromise;

    }


    this.scriptLoadingPromise =
      new Promise<void>(
        (resolve, reject) => {

          const existingScript =
            document.querySelector(
              `script[src="${this.scriptUrl}"]`,
            );


          if (existingScript) {

            if (window.$wompi) {

              resolve();

              return;

            }


            existingScript.addEventListener(
              'load',
              () => {

                if (!window.$wompi) {

                  reject(
                    new Error(
                      'Wompi JS cargó pero no está disponible.',
                    ),
                  );

                  return;

                }

                resolve();

              },
              { once: true },
            );


            existingScript.addEventListener(
              'error',
              () => {

                reject(
                  new Error(
                    'No se pudo cargar Wompi JS.',
                  ),
                );

              },
              { once: true },
            );

            return;

          }


          const script =
            document.createElement(
              'script',
            );


          script.src =
            this.scriptUrl;

          script.async = true;


          script.setAttribute(
            'data-public-key',
            environment.wompi.publicKey,
          );


          script.onload =
            () => {

              if (!window.$wompi) {

                reject(
                  new Error(
                    'Wompi JS cargó pero no está disponible.',
                  ),
                );

                return;

              }

              resolve();

            };


          script.onerror =
            () => {

              reject(
                new Error(
                  'No se pudo cargar Wompi JS.',
                ),
              );

            };


          document.head.appendChild(
            script,
          );

        },
      );


    this.scriptLoadingPromise.catch(
      () => {

        this.scriptLoadingPromise = null;

      },
    );


    return this.scriptLoadingPromise;

  }

}